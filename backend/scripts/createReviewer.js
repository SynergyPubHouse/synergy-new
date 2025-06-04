const axios = require('axios');

async function createReviewer() {
    try {
        const response = await axios.post('https://paper-sphere.vercel.app/api/auth/reviewer/register', {
            firstName: "John",
            lastName: "Smith",
            email: "john.smith@example.com",
            username: "johnsmith",
            password: "password123",
            specialization: "Computer Science",
            experience: 5
        });
        
        console.log('Reviewer created successfully:', response.data);
    } catch (error) {
        console.error('Error creating reviewer:', error.response?.data || error.message);
    }
}

createReviewer(); 