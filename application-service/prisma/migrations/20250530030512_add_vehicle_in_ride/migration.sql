-- AlterTable
ALTER TABLE `ride` ADD COLUMN `available_seats` INTEGER NULL,
    ADD COLUMN `price_per_member` DOUBLE NULL,
    ADD COLUMN `total_seats` INTEGER NULL,
    ADD COLUMN `vehicle_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `ScheduledRide` ADD COLUMN `vehicle_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ScheduledRide` ADD CONSTRAINT `ScheduledRide_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ride` ADD CONSTRAINT `ride_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
