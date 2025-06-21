-- CreateTable
CREATE TABLE `rating` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stars` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `ride_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NOT NULL,
    `reviewee_id` INTEGER NOT NULL,

    UNIQUE INDEX `rating_ride_id_reviewer_id_key`(`ride_id`, `reviewer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_ride_id_fkey` FOREIGN KEY (`ride_id`) REFERENCES `ride`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rating` ADD CONSTRAINT `rating_reviewee_id_fkey` FOREIGN KEY (`reviewee_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
