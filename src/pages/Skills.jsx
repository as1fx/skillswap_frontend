import { useState, useEffect, useRef } from 'react';
import { 
  getSkills, 
  getSkillsByCategory, 
  getSkillCategories, 
  getSkillByName,
  createSkill,
  updateSkill,
  deleteSkill,
  getUserSkills, 
  addSkillToUser, 
  removeSkillFromUser 
} from '../services/api';

export default function Skills() {
  // State for all skills and user skills
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState({
    OFFERED: [],
    DESIRED: []
  });
  
  // State for UI controls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentSkill, setCurrentSkill] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Refs for search debounce
  const searchTimeout = useRef(null);
  
  useEffect(() => {
    fetchCategories();
    fetchSkills();
    fetchUserSkills();
  }, []);
  
  // Effect for category filtering
  useEffect(() => {
    if (selectedCategory) {
      fetchSkillsByCategory(selectedCategory);
    } else {
      fetchSkills();
    }
  }, [selectedCategory]);
  
  // Effect for search debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (searchTerm) {
      searchTimeout.current = setTimeout(() => {
        handleSearch();
      }, 500);
    } else {
      fetchSkills();
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchCategories = async () => {
    try {
      const response = await getSkillCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await getSkills();
      setSkills(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching skills:', error);
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsByCategory = async (category) => {
    setLoading(true);
    try {
      const response = await getSkillsByCategory(category);
      setSkills(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching skills by category:', error);
      setError(`Failed to load skills in category: ${category}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await getSkillByName(searchTerm.trim());
      // Wrap the response in an array if it's a single object
      const skillsData = Array.isArray(response.data) ? response.data : [response.data];
      setSkills(skillsData);
      setError('');
    } catch (error) {
      console.error('Error searching for skills:', error);
      setError(`No skills found matching: "${searchTerm}"`);
      // Show empty results instead of old results
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserSkills = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        const response = await getUserSkills(user.id);
        // The backend now returns skills grouped by type in OFFERED and DESIRED
        setUserSkills({
          OFFERED: response.data?.OFFERED || [],
          DESIRED: response.data?.DESIRED || []
        });
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!currentSkill?.name?.trim()) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) throw new Error('User not found');
      
      // Add the skill with proper type
      await addSkillToUser(user.id, {
        skillName: currentSkill.name.trim(),
        type: currentSkill.type || 'OFFERED'
      });
      
      // Reset form and close modal
      setCurrentSkill(null);
      setIsCreateModalOpen(false);
      
      // Refresh user skills
      fetchUserSkills();
      setError('');
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRemoveSkill = async (skillId, type) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) return;
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) throw new Error('User not found');
      
      // Update local state immediately for responsive UI
      setUserSkills(prev => ({
        ...prev,
        [type]: prev[type].filter(skill => skill.id !== skillId)
      }));
      
      // Try to remove the skill from backend
      try {
        await removeSkillFromUser(user.id, skillId, type);
      } catch (backendError) {
        console.error('Backend error removing skill:', backendError);
        // We've already updated the UI, so no need to show an error to the user
      }
      
      setError('');
    } catch (error) {
      console.error('Error removing skill:', error);
      setError('Could not remove skill. Please try again later.');
    }
  };
  
  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!currentSkill?.name?.trim()) return;
    
    try {
      // Create a new skill
      const response = await createSkill({
        name: currentSkill.name.trim(),
        category: currentSkill.category || '',
        description: currentSkill.description || ''
      });
      
      // Add the newly created skill to the list
      setSkills(prev => [...prev, response.data]);
      
      // Reset form and close modal
      setCurrentSkill(null);
      setIsCreateModalOpen(false);
      setError('');
    } catch (error) {
      console.error('Error creating skill:', error);
      setError('Failed to create skill: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateSkill = async (e) => {
    e.preventDefault();
    if (!currentSkill?.id || !currentSkill?.name?.trim()) return;
    
    try {
      // Update the skill
      const response = await updateSkill(currentSkill.id, {
        name: currentSkill.name.trim(),
        category: currentSkill.category || '',
        description: currentSkill.description || ''
      });
      
      // Update the skill in the list
      setSkills(prev => 
        prev.map(skill => 
          skill.id === currentSkill.id ? response.data : skill
        )
      );
      
      // Reset form and close modal
      setCurrentSkill(null);
      setIsEditModalOpen(false);
      setError('');
    } catch (error) {
      console.error('Error updating skill:', error);
      setError('Failed to update skill: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    
    try {
      await deleteSkill(skillId);
      
      // Remove the skill from the list
      setSkills(prev => prev.filter(skill => skill.id !== skillId));
      setError('');
    } catch (error) {
      console.error('Error deleting skill:', error);
      setError('Failed to delete skill: ' + (error.response?.data?.message || error.message));
    }
  };

  const isSkillAdded = (skillId, type) => {
    return userSkills[type]?.some(userSkill => userSkill.id === skillId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading skills...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Skills Management</h1>
          <p className="text-gray-400 text-lg">
            Manage your skills and find others to learn from or teach
          </p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setCurrentSkill({ name: '', category: '', description: '' });
                  setIsCreateModalOpen(true);
                }}
                className="w-full md:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                + Add New Skill
              </button>
            </div>
          </div>
        </div>

        {/* Available Skills */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.length > 0 ? (
              skills.map((skill) => (
                <div key={skill.id} className="bg-gray-700 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setCurrentSkill(skill);
                            setIsEditModalOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit skill"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete skill"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {skill.category && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {skill.category}
                        </span>
                      </div>
                    )}
                    {skill.description && (
                      <p className="text-gray-300 text-sm mb-4">{skill.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <button
                      onClick={() => {
                        setCurrentSkill({...skill, type: 'OFFERED'});
                        handleAddSkill(new Event('click'));
                      }}
                      disabled={isSkillAdded(skill.id, 'OFFERED')}
                      className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                        isSkillAdded(skill.id, 'OFFERED')
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isSkillAdded(skill.id, 'OFFERED') ? 'Teaching' : 'I Can Teach This'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setCurrentSkill({...skill, type: 'DESIRED'});
                        handleAddSkill(new Event('click'));
                      }}
                      disabled={isSkillAdded(skill.id, 'DESIRED')}
                      className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                        isSkillAdded(skill.id, 'DESIRED')
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isSkillAdded(skill.id, 'DESIRED') ? 'Learning' : 'I Want to Learn This'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-400">No skills found. Try adjusting your search or category filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* User's Skills Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Skills I Can Teach */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">I Can Teach</h3>
            </div>
            
            {userSkills.OFFERED && userSkills.OFFERED.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userSkills.OFFERED.map((skill) => (
                  <div 
                    key={skill.id} 
                    className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    <span className="text-blue-300 mr-2">{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id, 'OFFERED')}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove skill"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-700 bg-opacity-50 rounded-md p-4 text-center">
                <p className="text-gray-400">No teaching skills added yet</p>
              </div>
            )}
          </div>

          {/* Skills I Want to Learn */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-green-500 rounded-full p-2 mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">I Want to Learn</h3>
            </div>
            
            {userSkills.DESIRED && userSkills.DESIRED.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userSkills.DESIRED.map((skill) => (
                  <div 
                    key={skill.id} 
                    className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full px-3 py-1 text-sm flex items-center"
                  >
                    <span className="text-green-300 mr-2">{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id, 'DESIRED')}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Remove skill"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-700 bg-opacity-50 rounded-md p-4 text-center">
                <p className="text-gray-400">No learning skills added yet</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Create Skill Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Create New Skill</h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateSkill} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Skill Name</label>
                  <input
                    type="text"
                    value={currentSkill?.name || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, name: e.target.value})}
                    placeholder="E.g. JavaScript, Piano, Cooking"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={currentSkill?.category || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, category: e.target.value})}
                    placeholder="E.g. Programming, Music, Culinary"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={currentSkill?.description || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, description: e.target.value})}
                    placeholder="Brief description of this skill"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Create Skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit Skill Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Edit Skill</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleUpdateSkill} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Skill Name</label>
                  <input
                    type="text"
                    value={currentSkill?.name || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, name: e.target.value})}
                    placeholder="E.g. JavaScript, Piano, Cooking"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={currentSkill?.category || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, category: e.target.value})}
                    placeholder="E.g. Programming, Music, Culinary"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={currentSkill?.description || ''}
                    onChange={(e) => setCurrentSkill({...currentSkill, description: e.target.value})}
                    placeholder="Brief description of this skill"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Update Skill
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Skill Detail Modal */}
        {isDetailModalOpen && currentSkill && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Skill Details</h3>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{currentSkill.name}</h4>
                  {currentSkill.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {currentSkill.category}
                    </span>
                  )}
                </div>
                
                {currentSkill.description && (
                  <div>
                    <p className="text-gray-300">{currentSkill.description}</p>
                  </div>
                )}
                
                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
