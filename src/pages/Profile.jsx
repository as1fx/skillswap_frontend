import { useState, useEffect } from 'react';
import { getUser, getUserSkills, updateUser } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState({
    general: [],
    offered: [],
    desired: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    bio: ''
  });

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
        
        // Fetch user skills
        const skillsResponse = await getUserSkills(userData.id);
        console.log('Skills Response:', skillsResponse);
        const grouped = {
          general: skillsResponse.data?.general || [],
          offered: skillsResponse.data?.offered || [],
          desired: skillsResponse.data?.desired || []
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
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 text-sm">Username:</span>
                <p className="text-white text-lg">{user.username}</p>
              </div>
              
              <div>
                <span className="text-gray-400 text-sm">Email:</span>
                <p className="text-white text-lg">{user.email}</p>
              </div>
              
              <div>
                <span className="text-gray-400 text-sm">Bio:</span>
                <p className="text-white text-lg">{user.bio || 'No bio provided'}</p>
              </div>
              
              <div>
                <span className="text-gray-400 text-sm">Member since:</span>
                <p className="text-white text-lg">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Skills Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* General Skills */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">My Skills</h3>
            {userSkills.general.length > 0 ? (
              <div className="space-y-2">
                {userSkills.general.map((skill) => (
                  <div key={skill.id} className="bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No skills added yet</p>
            )}
          </div>

          {/* Skills I Can Teach */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">I Can Teach</h3>
            {userSkills.offered.length > 0 ? (
              <div className="space-y-2">
                {userSkills.offered.map((skill) => (
                  <div key={skill.id} className="bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No teaching skills added yet</p>
            )}
          </div>

          {/* Skills I Want to Learn */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">I Want to Learn</h3>
            {userSkills.desired.length > 0 ? (
              <div className="space-y-2">
                {userSkills.desired.map((skill) => (
                  <div key={skill.id} className="bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No learning goals added yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors">
              Manage Skills
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors">
              View Swap Requests
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded transition-colors">
              Find Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
