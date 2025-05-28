-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `last_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `cpf` VARCHAR(45) NULL,
    `phone` VARCHAR(45) NULL,
    `street` VARCHAR(45) NULL,
    `number` INTEGER NULL,
    `city` VARCHAR(45) NULL,
    `zipcode` VARCHAR(45) NULL,
    `create_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `verified` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cnh_verified` BOOLEAN NULL,
    `active` BOOLEAN NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `driver_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passenger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `active` BOOLEAN NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `passenger_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RideGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `driver_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RideGroupMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `join_date` INTEGER NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `group_id` INTEGER NOT NULL,
    `passenger_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduledRide` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `scheduled_date` DATETIME(3) NULL,
    `estimated_cost` DOUBLE NULL,
    `available_seats` INTEGER NULL,
    `total_seats` INTEGER NULL,
    `start_location` VARCHAR(255) NULL,
    `end_location` VARCHAR(255) NULL,
    `distance` DOUBLE NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `group_id` INTEGER NOT NULL,
    `driver_id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ride` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_location` VARCHAR(255) NULL,
    `end_location` VARCHAR(255) NULL,
    `distance` DOUBLE NULL,
    `departure_time` DATETIME(3) NULL,
    `total_cost` DOUBLE NULL,
    `fuel_price` DOUBLE NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `driver_id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ride_request` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `start_location` VARCHAR(255) NULL,
    `end_location` VARCHAR(255) NULL,
    `status` VARCHAR(255) NULL,
    `passenger_share` DOUBLE NULL,
    `created_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NULL,
    `ride_id` INTEGER NOT NULL,
    `passanger_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `model` VARCHAR(255) NULL,
    `brand` VARCHAR(255) NULL,
    `year` INTEGER NULL,
    `phone` VARCHAR(45) NULL,
    `street` VARCHAR(45) NULL,
    `number` INTEGER NULL,
    `renavam` VARCHAR(255) NULL,
    `plate` VARCHAR(255) NULL,
    `fuel_consumption` DOUBLE NULL,
    `create_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `driver_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `driver` ADD CONSTRAINT `driver_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passenger` ADD CONSTRAINT `passenger_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RideGroup` ADD CONSTRAINT `RideGroup_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RideGroupMember` ADD CONSTRAINT `RideGroupMember_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `RideGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RideGroupMember` ADD CONSTRAINT `RideGroupMember_passenger_id_fkey` FOREIGN KEY (`passenger_id`) REFERENCES `passenger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledRide` ADD CONSTRAINT `ScheduledRide_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `RideGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledRide` ADD CONSTRAINT `ScheduledRide_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduledRide` ADD CONSTRAINT `ScheduledRide_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride` ADD CONSTRAINT `ride_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride` ADD CONSTRAINT `ride_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_ride_id_fkey` FOREIGN KEY (`ride_id`) REFERENCES `ride`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride_request` ADD CONSTRAINT `ride_request_passanger_id_fkey` FOREIGN KEY (`passanger_id`) REFERENCES `passenger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `driver`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
