import { useState, useEffect } from 'react';
import { getUser, getUserSkills, updateUser, addSkillToUser, removeSkillFromUser } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState({
    OFFERED: [],
    DESIRED: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [skillType, setSkillType] = useState('OFFERED');
  const [newSkill, setNewSkill] = useState('');
  const [skillsLoading, setSkillsLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = localStorage.getItem('user');
      
      console.log('Token:', token);
      console.log('Current User:', currentUser);
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      let userData;
      try {
        userData = JSON.parse(currentUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
        setError('Invalid user data. Please login again.');
        setLoading(false);
        return;
      }

      if (!userData || !userData.id) {
        setError('No user ID found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching user details for ID:', userData.id);
      
      try {
        // Fetch user details
        const userResponse = await getUser(userData.id);
        console.log('User Response:', userResponse);
        setUser(userResponse.data);
        
        // Fetch user skills - our API service now returns empty arrays on error
        const skillsResponse = await getUserSkills(userData.id);
        console.log('Skills Response:', skillsResponse);
        
        if (skillsResponse.status >= 400) {
          console.warn('Skills API returned error status:', skillsResponse.status);
        }
        
        // Set the skills from response or use empty arrays
        const grouped = {
          OFFERED: skillsResponse.data?.OFFERED || [],
          DESIRED: skillsResponse.data?.DESIRED || []
        };
        setUserSkills(grouped);
        
        // Set edit form
        setEditForm({
          username: userResponse.data?.username || '',
          email: userResponse.data?.email || '',
          bio: userResponse.data?.bio || ''
        });
      } catch (apiError) {
        console.error('API Error:', apiError);
        console.error('API Error Response:', apiError.response);
        setError(
          apiError.response?.data?.message || 
          apiError.message || 
          'Failed to fetch profile data'
        );
        return;
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      setError('Failed to load profile: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser && currentUser.id) {
        await updateUser(currentUser.id, editForm);
        
        // Update local user data
        setUser(prev => ({ ...prev, ...editForm }));
        
        // Update localStorage
        const updatedUser = { ...currentUser, ...editForm };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setIsEditing(false);
        setError('');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleInputChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    
    setSkillsLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) throw new Error('User not found');
      
      // Log what we're sending to help debug
      console.log('Adding skill with payload:', {
        skillName: newSkill.trim(),
        type: skillType
      });
      
      // Send the request in the format expected by the backend
      await addSkillToUser(currentUser.id, {
        skillName: newSkill.trim(), // Backend expects skillName, not name
        type: skillType             // OFFERED or DESIRED
      });
      
      // Since we're having backend issues with refreshing skills,
      // just update the local state for now
      setUserSkills(prev => ({
        ...prev,
        [skillType]: [...prev[skillType], { 
          id: Date.now(), // Temporary ID
          name: newSkill.trim() 
        }]
      }));
      
      setNewSkill('');
      setError('');
    } catch (error) {
      console.error('Error adding skill:', error);
      // Show a more user-friendly error message
      setError('Could not add skill. Please try again later.');
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleRemoveSkill = async (skillId, type) => {
    if (!window.confirm('Are you sure you want to remove this skill?')) return;
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser || !currentUser.id) throw new Error('User not found');
      
      // Update local state immediately for responsive UI
      setUserSkills(prev => ({
        ...prev,
        [type]: prev[type].filter(skill => skill.id !== skillId)
      }));
      
      // Try to remove the skill from backend
      try {
        await removeSkillFromUser(currentUser.id, skillId, type);
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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-400">Unable to load your profile.</p>
        </div>
      </div>
    );
  }

  // Skill Management Modal Component
  const SkillManagementModal = () => {
    if (!isSkillModalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
    
          
          {/* Skill Type Selector */}
          <div className="mb-6">
            <div className="flex border border-gray-600 rounded-md overflow-hidden">
              <button 
                onClick={() => setSkillType('OFFERED')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${skillType === 'OFFERED' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                I Can Teach
              </button>
              <button 
                onClick={() => setSkillType('DESIRED')}
                className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${skillType === 'DESIRED' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                I Want to Learn
              </button>
            </div>
          </div>
          
          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} className="mb-6">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value.split(' ')[0])} // Only allow single word
                placeholder="Enter a skill (one word only)"
                className="flex-1 px-4 py-3 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={skillsLoading || !newSkill.trim()}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                {skillsLoading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Add'
                )}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-2">Examples: JavaScript, Piano, Cooking, Math</p>
          </form>
          
          {/* Skills List */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">
              Current {skillType === 'OFFERED' ? 'Teaching' : 'Learning'} Skills
            </h4>
            
            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <div className="bg-gray-700 rounded-md p-4">
              {userSkills[skillType].length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userSkills[skillType].map((skill) => (
                    <div key={skill.id} className="bg-gray-600 rounded-full px-3 py-1 flex items-center">
                      <span className="text-white mr-2">{skill.name}</span>
                      <button 
                        onClick={() => handleRemoveSkill(skill.id, skillType)}
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
                <p className="text-gray-400 text-center py-2">
                  No {skillType === 'OFFERED' ? 'teaching' : 'learning'} skills added yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">My Profile</h1>
          <p className="text-gray-400 text-lg">Manage your profile and skills</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-gray-700 rounded-lg p-4">
                <span className="text-gray-400 text-sm font-medium block mb-1">Username</span>
                <p className="text-white text-lg">{user?.username || 'N/A'}</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <span className="text-gray-400 text-sm font-medium block mb-1">Email</span>
                <p className="text-white text-lg">{user?.email || 'N/A'}</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <span className="text-gray-400 text-sm font-medium block mb-1">Bio</span>
                <p className="text-white text-lg">{user?.bio || 'No bio provided'}</p>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-4">
                <span className="text-gray-400 text-sm font-medium block mb-1">Member since</span>
                <p className="text-white text-lg">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Skills Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">My Skills</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              {userSkills.OFFERED.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userSkills.OFFERED.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-full px-4 py-1 text-blue-300 font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-700 bg-opacity-50 rounded-md p-4 text-center">
                  <p className="text-gray-400">No teaching skills added yet</p>
                  <button
                    onClick={() => {
                      setSkillType('OFFERED');
                      setIsSkillModalOpen(true);
                    }}
                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add teaching skills
                  </button>
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
              
              {userSkills.DESIRED.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userSkills.DESIRED.map((skill) => (
                    <span 
                      key={skill.id} 
                      className="bg-green-500 bg-opacity-20 border border-green-500 rounded-full px-4 py-1 text-green-300 font-medium"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-700 bg-opacity-50 rounded-md p-4 text-center">
                  <p className="text-gray-400">No learning skills added yet</p>
                  <button
                    onClick={() => {
                      setSkillType('DESIRED');
                      setIsSkillModalOpen(true);
                    }}
                    className="mt-2 text-green-400 hover:text-green-300 text-sm"
                  >
                    + Add learning skills
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors">
              View Swap Requests
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded transition-colors">
              Find Matches
            </button>
          </div>
        </div>
      </div>
      
      {/* Render the skill management modal */}
      <SkillManagementModal />
    </div>
  );
}
