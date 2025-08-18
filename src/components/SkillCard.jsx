import { useState } from 'react';

export default function SkillCard({ skill, onSelect, isSelected = false }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    if (onSelect) {
      onSelect(skill);
    }
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-2 ring-purple-500 bg-gray-700' 
          : 'hover:shadow-lg hover:scale-105'
      }`}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">{skill.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showDetails ? '−' : '+'}
          </button>
        </div>
        
        {skill.description && (
          <p className="text-gray-400 text-sm mb-3">{skill.description}</p>
        )}
        
        {showDetails && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="space-y-2 text-sm">
              {skill.category && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Category:</span>
                  <span className="text-white">{skill.category}</span>
                </div>
              )}
              
              {skill.difficulty && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className="text-white">{skill.difficulty}</span>
                </div>
              )}
              
              {skill.estimatedTime && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Time to Learn:</span>
                  <span className="text-white">{skill.estimatedTime}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Skill Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {skill.tags.map((tag, index) => (
              <span 
                key={index} 
                className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
