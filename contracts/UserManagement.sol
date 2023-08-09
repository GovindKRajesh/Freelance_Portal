// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UserManagement {
    
    struct User {
        address userAddress;
        string name;
        string contactInfo;
        bool isFreelancer;
        bool isRegistered;
    }

    // Mapping to hold registered users
    mapping(address => User) public users;

    // Events
    event UserRegistered(address indexed userAddress, string name, bool isFreelancer);

    /**
     * @dev Register a new user.
     * @param name Name of the user.
     * @param contactInfo Contact information of the user.
     * @param isFreelancer Flag to check if the user is a freelancer or client.
     */
    function registerUser(string memory name, string memory contactInfo, bool isFreelancer) public {
        require(!users[msg.sender].isRegistered, "User is already registered.");

        users[msg.sender] = User(msg.sender, name, contactInfo, isFreelancer, true);

        emit UserRegistered(msg.sender, name, isFreelancer);
    }

    /**
     * @dev Get user details by address.
     * @param _userAddress Address of the user.
     * @return User details.
     */
    function getUser(address _userAddress) public view returns (User memory) {
        require(users[_userAddress].isRegistered, "User is not registered.");
        return users[_userAddress];
    }

    /**
     * @dev Check if a user is registered by address.
     * @param userAddress Address of the user.
     * @return Boolean indicating whether the user is registered.
     */
    function isUserRegistered(address userAddress) public view returns (bool) {
        return users[userAddress].isRegistered;
    }

    /**
     * @dev Check if a user is a freelancer by address.
     * @param userAddress Address of the user.
     * @return Boolean indicating whether the user is a freelancer.
     */
    function isUserFreelancer(address userAddress) public view returns (bool) {
        return users[userAddress].isFreelancer;
    }
    
}