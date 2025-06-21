-- Add groupId field to ride table
ALTER TABLE `ride` ADD COLUMN `group_id` INT NULL;

-- Add foreign key constraint
ALTER TABLE `ride` ADD CONSTRAINT `ride_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `RideGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better performance
CREATE INDEX `ride_group_id_idx` ON `ride`(`group_id`);
