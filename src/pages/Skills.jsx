import { useState, useEffect } from 'react';
import { getSkills, getUserSkills, addSkillToUser, removeSkillFromUser } from '../services/api';

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [userSkills, setUserSkills] = useState({
    general: [],
    offered: [],
    desired: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchUserSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await getSkills();
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setError('Failed to load skills');
    }
  };

  const fetchUserSkills = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        const response = await getUserSkills(user.id);
        // Group skills by type
        const grouped = {
          general: response.data.general || [],
          offered: response.data.offered || [],
          desired: response.data.desired || []
        };
        setUserSkills(grouped);
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (skillId, type) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        await addSkillToUser(user.id, skillId, type);
        // Refresh user skills
        fetchUserSkills();
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skillId, type) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        await removeSkillFromUser(user.id, skillId, type);
        // Refresh user skills
        fetchUserSkills();
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      setError('Failed to remove skill');
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

        {/* Available Skills */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Available Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{skill.name}</h3>
                {skill.category && (
                  <p className="text-purple-400 text-sm mb-2">{skill.category}</p>
                )}
                {skill.description && (
                  <p className="text-gray-300 text-sm mb-4">{skill.description}</p>
                )}
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddSkill(skill.id, 'general')}
                    disabled={isSkillAdded(skill.id, 'general')}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                      isSkillAdded(skill.id, 'general')
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSkillAdded(skill.id, 'general') ? 'Added' : 'Add to My Skills'}
                  </button>
                  
                  <button
                    onClick={() => handleAddSkill(skill.id, 'offered')}
                    disabled={isSkillAdded(skill.id, 'offered')}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                      isSkillAdded(skill.id, 'offered')
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isSkillAdded(skill.id, 'offered') ? 'Teaching' : 'I Can Teach This'}
                  </button>
                  
                  <button
                    onClick={() => handleAddSkill(skill.id, 'desired')}
                    disabled={isSkillAdded(skill.id, 'desired')}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                      isSkillAdded(skill.id, 'desired')
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {isSkillAdded(skill.id, 'desired') ? 'Learning' : 'I Want to Learn This'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User's Skills Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* General Skills */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">My Skills</h3>
            {userSkills.general.length > 0 ? (
              <div className="space-y-2">
                {userSkills.general.map((skill) => (
                  <div key={skill.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id, 'general')}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
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
                  <div key={skill.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id, 'offered')}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
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
                  <div key={skill.id} className="flex justify-between items-center bg-gray-700 rounded p-2">
                    <span className="text-white">{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id, 'desired')}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No learning goals added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
