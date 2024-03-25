# BlogSphere

BlogSphere is a simple blogging platform built with Node.js, Express, and MongoDB.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

BlogSphere provides a user-friendly interface for users to create, edit, and manage blog posts. It allows users to register for an account, log in securely, and interact with posts through features like creating, editing, and deleting posts, as well as adding comments. The platform is built using modern web technologies and follows best practices for security and performance.

## Features

- User authentication: Secure user registration and login using Passport.js.
- Post management: Create, edit, and delete blog posts with ease.
- Commenting system: Engage with posts by adding comments.
- User profiles: View user profiles and their authored posts.
- Responsive design: The platform is optimized for various screen sizes, including mobile devices.

## Setup

To run BlogSphere locally, follow these steps:

1. **Clone the repository:**

```
git clone https://github.com/abdel-moaty/BlogSphere.git
```

2. **Install dependencies:**

```
cd BlogSphere
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory and add the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/BlogSphere
SESSION_SECRET=your_session_secret
```
Replace `your_session_secret` with a random string for session management.

4. **Start the server:**

The application should now be running on http://localhost:3000.

## Usage

- Navigate to http://localhost:3000 to access the BlogSphere platform.
- Register for an account to create, edit, and delete posts.
- Explore the different pages such as Home, Profile, New Post, etc.
- For further assistance, visit the Help page or contact us via the Contact page.

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
