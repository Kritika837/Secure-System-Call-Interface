const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/syscall_logger')
.then(async () => {
    console.log('Connected to DB');
    await User.deleteMany({});
    
    await User.create({
        username: 'admin',
        password: 'adminpassword',
        role: 'Admin'
    });

    await User.create({
        username: 'user',
        password: 'userpassword',
        role: 'User'
    });

    console.log('Database seeded with "admin" (Admin) and "user" (User)');
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
