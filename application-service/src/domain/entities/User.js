class User {
    constructor({
        id,
        name,
        last_name,
        email,
        password,
        cpf,
        phone,
        street,
        number,
        city,
        zipcode,
        createAt,
        updatedAt,
        verified
    }) {
        this.id = id;
        this.name = name;
        this.last_name = last_name;
        this.email = email;
        this.password = password;
        this.cpf = cpf;
        this.phone = phone;
        this.street = street;
        this.number = number;
        this.city = city;
        this.zipcode = zipcode;
        this.createAt = createAt || new Date();
        this.updatedAt = updatedAt;
        this.verified = verified || false;
        this.driver = null;
        this.passenger = null;
    }

    getFullName() {
        return `${this.name} ${this.last_name}`;
    }

    getAddress() {
        if (!this.street || !this.number) return null;
        return `${this.street}, ${this.number}, ${this.city || ''} ${this.zipcode || ''}`;
    }

    setDriver(driver) {
        this.driver = driver;
        return this;
    }

    setPassenger(passenger) {
        this.passenger = passenger;
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            last_name: this.last_name,
            email: this.email,
            cpf: this.cpf,
            phone: this.phone,
            street: this.street,
            number: this.number,
            city: this.city,
            zipcode: this.zipcode,
            createAt: this.createAt,
            updatedAt: this.updatedAt,
            verified: this.verified
        };
    }
}

module.exports = User;