class Group {
    constructor({
        id,
        name,
        users = [],
    }) {
        this.id = id;
        this.name = name;
        this.users = users;
    }
    getName() { 
        return this.name;
    }

    getUsers() {
        return this.users;
    }

    addUser(user) {
        if (!this.users.find(u => u.id === user.id)) {
            this.users.push(user);
        }
    }
    removeUser(user) {
        this.users = this.users.filter(u => u.id !== user.id);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
        };
    }
}

module.exports = Group;