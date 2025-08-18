// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { getUsers, searchUsers } from '../services/api';
import UserCard from '../components/UserCard';

export default function Home() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all'); // 'all', 'offered', 'desired'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, skillFilter]);

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
        setError('');
      } else {
        setError(response.data.message || 'Failed to load users.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.offeredSkills?.some(skill => 
          skill.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        user.desiredSkills?.some(skill => 
          skill.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply skill type filter
    if (skillFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (skillFilter === 'offered') {
          return user.offeredSkills && user.offeredSkills.length > 0;
        } else if (skillFilter === 'desired') {
          return user.desiredSkills && user.desiredSkills.length > 0;
        }
        return true;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const response = await searchUsers(searchQuery);
        if (response.data.success) {
          setUsers(response.data.data);
          setError('');
        } else {
          setError(response.data.message || 'Search failed.');
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setError('Search failed. Please try again.');
      }
    } else {
      fetchUsers();
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSkillFilter('all');
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">SkillSwap Community</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Connect with people who can teach you new skills or learn from your expertise. 
            Find the perfect skill exchange partner today!
          </p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users, skills, or bios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-gray-300 font-medium">Filter by:</span>
            
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Users</option>
              <option value="offered">Can Teach Skills</option>
              <option value="desired">Want to Learn Skills</option>
            </select>

            <button
              onClick={clearFilters}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Clear Filters
            </button>

            <span className="text-gray-400 text-sm">
              Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>
        </div>

        {/* Users Grid */}
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery || skillFilter !== 'all' ? 'No users found' : 'No users available'}
            </div>
            <p className="text-gray-500">
              {searchQuery || skillFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Check back later for new users'
              }
            </p>
            {(searchQuery || skillFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}