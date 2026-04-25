const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'context', 'DataContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (content.includes('const getFriendsByUser')) {
  console.log('getFriendsByUser already exists — no changes needed.');
  process.exit(0);
}

// Find the end of getFriends and locate the next function
const getFriendsEnd = content.indexOf('}, []);\n\n  const updateParticipantType');
if (getFriendsEnd === -1) {
  // Try alternate newline style
  const alt = content.indexOf('}, []);\r\n\r\n  const updateParticipantType');
  if (alt === -1) {
    console.log('Could not find insertion point. Dumping context...');
    const idx = content.indexOf('updateParticipantType');
    console.log('updateParticipantType at:', idx);
    console.log('Surrounding:', JSON.stringify(content.substring(Math.max(0, idx-80), idx+40)));
    process.exit(1);
  }
}

const insertAfter = '}, []);\n\n  const updateParticipantType';

const newCode = `}, []);

  const getFriendsByUser = async (userId: string): Promise<Participant[]> => {
    try {
      return await databaseService.getFriendsByUser(userId);
    } catch (error) {
      console.error('Error getting friends by user:', error);
      return [];
    }
  };

  const getUserPreference = async (userId: string, key: string): Promise<string | null> => {
    try {
      return await databaseService.getUserPreference(userId, key);
    } catch (error) {
      return null;
    }
  };

  const setUserPreference = async (userId: string, key: string, value: string): Promise<void> => {
    try {
      await databaseService.setUserPreference(userId, key, value);
    } catch (error) {
      console.error('Error setting user preference:', error);
    }
  };

  const incrementParticipantUsage = async (participantId: string): Promise<void> => {
    try {
      await databaseService.incrementParticipantUsage(participantId);
    } catch (error) {
      console.error('Error incrementing participant usage:', error);
    }
  };

  const updateParticipantType`;

content = content.replace(insertAfter, newCode);

if (!content.includes('const getFriendsByUser')) {
  console.log('FAILED: replacement did not work.');
  process.exit(1);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('SUCCESS: Added getFriendsByUser, getUserPreference, setUserPreference, incrementParticipantUsage');
