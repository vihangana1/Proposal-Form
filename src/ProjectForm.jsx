import React, { useState, useRef } from 'react';

// Simple icon components (replacing lucide-react)
const Upload = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const Plus = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Trash2 = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const Send = ({ style }) => (
  <svg style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ProjectForm = () => {
  const [formData, setFormData] = useState({
    district: '',
    dn: '',
    gn: '',
    file: null
  });

  
  const fileInputRef = useRef(null);


  const [projects, setProjects] = useState([
    {
      id: 1,
      no: '1',
      proposal: '',
      estimatedCost: '',
      approach: '',
      sdgGoals: '',
      fundingSource: '',
      name: '',
      institution: ''
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ⚠️ IMPORTANT: Replace this with your Google Apps Script URL
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8ZgKUoWpMCQlUT0c6RKHiHT-m9843bBj___H780jlPh2Tu0WkE2LdSX9B7PH7sdBmqg/exec';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'ගොනුව 10MB ට වඩා කුඩා විය යුතුය' });
        return;
      }
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleProjectChange = (id, field, value) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, [field]: value } : project
      )
    );
  };

  const addProject = () => {
    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    setProjects(prev => [
      ...prev,
      {
        id: newId,
        no: String(prev.length + 1),
        proposal: '',
        estimatedCost: '',
        approach: '',
        sdgGoals: '',
        fundingSource: '',
        name: '',
        institution: ''
      }
    ]);
  };

  const removeProject = (id) => {
    if (projects.length === 1) {
      setMessage({ type: 'error', text: 'අවම වශයෙන් එක් ව්‍යාපෘතියක් තිබිය යුතුය' });
      return;
    }
    setProjects(prev => {
      const filtered = prev.filter(project => project.id !== id);
      return filtered.map((project, index) => ({
        ...project,
        no: String(index + 1)
      }));
    });
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateForm = () => {
    // Check main fields
    if (!formData.district || !formData.dn || !formData.gn) {
      setMessage({ type: 'error', text: 'කරුණාකර සියලු ප්‍රධාන ක්ෂේත්‍ර පුරවන්න' });
      return false;
    }
  
    // NEW: Check if file is uploaded
    if (!formData.file) {
      setMessage({ type: 'error', text: 'කරුණාකර අදාළ ගොනුව උඩුගත කරන්න (File upload is required)' });
      return false;
    }
  
    // Check projects
    for (const project of projects) {
      if (!project.proposal || !project.estimatedCost) {
        setMessage({ type: 'error', text: 'කරුණාකර සියලු ව්‍යාපෘති විස්තර පුරවන්න' });
        return false;
      }
    }
  
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      let fileData = null;
      
      if (formData.file) {
        const base64 = await convertFileToBase64(formData.file);
        fileData = {
          name: formData.file.name,
          mimeType: formData.file.type,
          data: base64
        };
      }

      const payload = {
        district: formData.district,
        dn: formData.dn,
        gn: formData.gn,
        file: fileData,
        timestamp: new Date().toISOString(),
        projects: projects.map(p => ({
          no: p.no,
          proposal: p.proposal,
          estimatedCost: p.estimatedCost,
          approach: p.approach,
          sdgGoals: p.sdgGoals,
          fundingSource: p.fundingSource,
          name: p.name,
          institution: p.institution
        }))
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setMessage({ type: 'success', text: 'දත්ත සාර්ථකව ඉදිරිපත් කරන ලදී!' });
      
      // Reset form
      setFormData({ district: '', dn: '', gn: '', file: null });
      setProjects([{
        id: 1,
        no: '1',
        proposal: '',
        estimatedCost: '',
        approach: '',
        sdgGoals: '',
        fundingSource: '',
        name: '',
        institution: ''
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'දත්ත ඉදිරිපත් කිරීමේ දෝෂයක් ඇතිවිය. කරුණාකර නැවත උත්සාහ කරන්න.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            සංවර්ධන යෝජනා ඉදිරිපත් කිරීමේ පෝරමය
          </h1>
          <p style={styles.subtitle}>
            Development Proposal Submission Form
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div style={{
            ...styles.message,
            ...(message.type === 'success' ? styles.messageSuccess : styles.messageError)
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Main Fields */}
          <div style={styles.mainFieldsContainer}>
            <h2 style={styles.sectionTitle}>
              ප්‍රධාන තොරතුරු / Main Information
            </h2>
            
            <div style={styles.gridThree}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  දිස්ත්‍රික්කය / District *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  ප්‍රාදේශීය ලේකම් කොට්ඨාසය / DS *
                </label>
                <input
                  type="text"
                  name="dn"
                  value={formData.dn}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  ග්‍රාම නිලධාරී කොට්ඨාසය / GN *
                </label>
                <input
                  type="text"
                  name="gn"
                  value={formData.gn}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.fileSection}>
              <label style={styles.label}>
                ගොනුව උඩුගත කරන්න / Upload File
              </label>
              <div style={styles.fileInputWrapper}>
                <label style={styles.fileLabel}>
                  <Upload style={styles.icon} />
                  <span style={styles.fileText}>
                    {formData.file ? formData.file.name : 'ගොනුවක් තෝරන්න'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </label>
                {formData.file && (
                    <button
                        type="button"
                        onClick={() => {
                        setFormData(prev => ({ ...prev, file: null }));
                        if (fileInputRef.current) {
                            fileInputRef.current.value = ""; // This is the secret fix!
                        }
                        }}
                        style={styles.removeFileBtn}
                    >
                        ඉවත් කරන්න
                    </button>
                    )}
              </div>
              <p style={styles.helpText}>
                PDF, Word, or Excel files (Max 10MB)
              </p>
            </div>
          </div>

          {/* Projects Section */}
          <div style={styles.projectsSection}>
            <div style={styles.projectsHeader}>
              <h2 style={styles.projectsTitle}>
                ව්‍යාපෘති / Projects
              </h2>
              <button
                type="button"
                onClick={addProject}
                style={styles.addProjectBtn}
              >
                <Plus style={styles.iconSmall} />
                ව්‍යාපෘතිය එක් කරන්න
              </button>
            </div>

            {projects.map((project) => (
              <div key={project.id} style={styles.projectCard}>
                <div style={styles.projectHeader}>
                  <h3 style={styles.projectNumber}>
                    ව්‍යාපෘතිය #{project.no}
                  </h3>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(project.id)}
                      style={styles.removeProjectBtn}
                    >
                      <Trash2 style={styles.iconSmall} />
                      ඉවත් කරන්න
                    </button>
                  )}
                </div>

                <div style={styles.gridTwo}>
                  <div style={{ ...styles.fieldGroup, gridColumn: '1 / -1' }}>
                    <label style={styles.label}>
                      සංවර්ධන යෝජනා / Development Proposal *
                    </label>
                    <textarea
                      value={project.proposal}
                      onChange={(e) => handleProjectChange(project.id, 'proposal', e.target.value)}
                      style={styles.textarea}
                      rows="3"
                      required
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        අපේක්ශිත දල ඇස්තමේන්තුව / Estimated Cost *
                    </label>
                    <input
                        type="number"
                        value={project.estimatedCost}
                        onChange={(e) => handleProjectChange(project.id, 'estimatedCost', e.target.value)}
                        style={styles.input}
                        required
                    />
                    </div>

                    <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        සංවර්දන ප්‍රවේශ / Development Approach
                    </label>
                    <select
                        value={project.approach}
                        onChange={(e) => handleProjectChange(project.id, 'approach', e.target.value)}
                        style={styles.input}
                    >
                        <option value="">-- Select --</option>
                        <option value="සමජ පරිසර">සමජ පරිසර</option>
                        <option value="ආහාර සුරක්ෂිතතාව">ආහාර සුරක්ෂිතතාව</option>
                        <option value="නිශ්පාදන ආර්ථිකය">නිශ්පාදන ආර්ථිකය</option>
                        <option value="මානව සම්පත් සංවර්දන">මානව සම්පත් සංවර්දන</option>
                        <option value="රැකවරනය">රැකවරනය</option>
                        <option value="සැලසුම් ජාල හා ප්‍රවේශය">සැලසුම් ජාල හා ප්‍රවේශය</option>
                    </select>
                    </div>


                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      තිරසර සංවර්දන ඉලක්ක / SDG Goals
                    </label>
                    <input
                      type="text"
                      value={project.sdgGoals}
                      onChange={(e) => handleProjectChange(project.id, 'sdgGoals', e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                        අපේක්ශිත ප්‍රතිපාදන ප්‍රබව / Funding Source
                    </label>
                    <select
                        value={project.fundingSource}
                        onChange={(e) => handleProjectChange(project.id, 'fundingSource', e.target.value)}
                        style={styles.input}
                    >
                        <option value="">-- Select --</option>
                        <option value="පලාත් පාලන">පලාත් පාලන</option>
                        <option value="ප්‍රාදේශීය සභා">ප්‍රාදේශීය සභා</option>
                        <option value="රාජ්‍ය නොවන සංවිදාන">රාජ්‍ය නොවන සංවිදාන</option>
                        <option value="රේකීය අමාත්‍යාංශය">රේකීය අමාත්‍යාංශය</option>
                    </select>
                    </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      නම / Name
                    </label>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => handleProjectChange(project.id, 'name', e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>
                      ක්‍රියාත්මක ආයතන / Implementing Institution
                    </label>
                    <input
                      type="text"
                      value={project.institution}
                      onChange={(e) => handleProjectChange(project.id, 'institution', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div style={styles.submitContainer}>
            <button
              type="submit"
              disabled={uploading}
              style={{
                ...styles.submitBtn,
                ...(uploading ? styles.submitBtnDisabled : {})
              }}
            >
              {uploading ? (
                <>
                  <div style={styles.spinner}></div>
                  ඉදිරිපත් කරමින්...
                </>
              ) : (
                <>
                  <Send style={styles.iconSmall} />
                  ඉදිරිපත් කරන්න
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline CSS Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
    padding: '32px 16px',
    fontFamily: '"Noto Sans Sinhala", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  formCard: {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    padding: '32px'
  },
  header: {
    borderBottom: '4px solid #4F46E5',
    paddingBottom: '16px',
    marginBottom: '32px'
  },
  title: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    margin: '0'
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: '8px'
  },
  message: {
    marginBottom: '24px',
    padding: '16px',
    borderRadius: '8px'
  },
  messageSuccess: {
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    color: '#166534'
  },
  messageError: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B'
  },
  mainFieldsContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#312E81',
    marginBottom: '16px'
  },
  gridThree: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px'
  },
  gridTwo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  fileSection: {
    marginTop: '24px'
  },
  fileInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    border: '2px dashed #D1D5DB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  fileText: {
    fontSize: '14px',
    color: '#6B7280'
  },
  hiddenInput: {
    display: 'none'
  },
  removeFileBtn: {
    color: '#DC2626',
    fontSize: '14px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  helpText: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '4px'
  },
  projectsSection: {
    marginBottom: '32px'
  },
  projectsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  projectsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1F2937',
    margin: '0'
  },
  addProjectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#16A34A',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  projectCard: {
    backgroundColor: '#F9FAFB',
    borderLeft: '4px solid #4F46E5',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '16px'
  },
  projectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  projectNumber: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0'
  },
  removeProjectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    color: '#DC2626',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  submitContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    backgroundColor: '#4F46E5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  submitBtnDisabled: {
    backgroundColor: '#9CA3AF',
    cursor: 'not-allowed'
  },
  icon: {
    width: '20px',
    height: '20px'
  },
  iconSmall: {
    width: '16px',
    height: '16px'
  },
  spinner: {
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    animation: 'spin 1s linear infinite'
  }
};

export default ProjectForm;