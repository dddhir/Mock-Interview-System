const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const createTestToken = () => {
    const testUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User'
    };

    const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log('🔑 Test Token Generated:');
    console.log(token);
    console.log('\n📋 Use this token in your browser localStorage:');
    console.log(`localStorage.setItem('token', '${token}')`);
    console.log('\n🚀 Then refresh the page and you should be logged in!');
};

createTestToken();