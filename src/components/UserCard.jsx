import { useState } from 'react';

export default function UserCard({ user }) {
  const [showAllSkills, setShowAllSkills] = useState(false);

  const toggleSkills = () => {
    setShowAllSkills(!showAllSkills);
  };

  const getSkillCount = (skills) => {
    return skills ? skills.length : 0;
  };

  const getDisplaySkills = (skills, maxVisible = 3) => {
    if (!skills || skills.length === 0) return [];
    return showAllSkills ? skills : skills.slice(0, maxVisible);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2 text-white">{user.username}</h2>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            <p className="text-gray-300 mb-4">{user.bio || 'No bio provided'}</p>
          </div>
          
          {/* Skill Count Badges */}
          <div className="flex flex-col gap-2 ml-4">
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs text-center">
              {getSkillCount(user.offeredSkills)} Teach
            </div>
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs text-center">
              {getSkillCount(user.desiredSkills)} Learn
            </div>
          </div>
        </div>
        
        {/* Offered Skills */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Skills I Can Teach:
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.offeredSkills && user.offeredSkills.length > 0 ? (
              <>
                {getDisplaySkills(user.offeredSkills).map((skill) => (
                  <span key={skill.id} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    {skill.name}
                  </span>
                ))}
                {user.offeredSkills.length > 3 && (
                  <button
                    onClick={toggleSkills}
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    {showAllSkills ? 'Show Less' : `+${user.offeredSkills.length - 3} More`}
                  </button>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm">No skills offered</span>
            )}
          </div>
        </div>
        
        {/* Desired Skills */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Skills I Want to Learn:
          </h3>
          <div className="flex flex-wrap gap-2">
            {user.desiredSkills && user.desiredSkills.length > 0 ? (
              <>
                {getDisplaySkills(user.desiredSkills).map((skill) => (
                  <span key={skill.id} className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                    {skill.name}
                  </span>
                ))}
                {user.desiredSkills.length > 3 && (
                  <button
                    onClick={toggleSkills}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    {showAllSkills ? 'Show Less' : `+${user.desiredSkills.length - 3} More`}
                  </button>
                )}
              </>
            ) : (
              <span className="text-gray-500 text-sm">No skills sought</span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors duration-300">
            Connect
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors duration-300">
            Message
          </button>
        </div>
      </div>
    </div>
  );
}