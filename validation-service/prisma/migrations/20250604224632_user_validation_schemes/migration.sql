-- CreateTable
CREATE TABLE `DriverValidation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `cnh` VARCHAR(10) NOT NULL,
    `cnh_front` VARCHAR(90) NOT NULL,
    `cnh_back` VARCHAR(90) NOT NULL,
    `bpk_link` VARCHAR(90) NOT NULL,
    `is_validated` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PassengerValidation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `rg_front` VARCHAR(90) NOT NULL,
    `rg_back` VARCHAR(90) NOT NULL,
    `bpk_link` VARCHAR(90) NOT NULL,
    `is_validated` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
