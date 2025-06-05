/*
  Warnings:

  - You are about to drop the column `create_at` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `vehicle` table. All the data in the column will be lost.
  - Added the required column `color` to the `vehicle` table without a default value. This is not possible if the table is not empty.
  - Made the column `model` on table `vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand` on table `vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `year` on table `vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `renavam` on table `vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `plate` on table `vehicle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fuel_consumption` on table `vehicle` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `vehicle` DROP COLUMN `create_at`,
    DROP COLUMN `number`,
    DROP COLUMN `phone`,
    DROP COLUMN `street`,
    ADD COLUMN `car_image_url` VARCHAR(500) NULL,
    ADD COLUMN `color` VARCHAR(100) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `model` VARCHAR(255) NOT NULL,
    MODIFY `brand` VARCHAR(255) NOT NULL,
    MODIFY `year` INTEGER NOT NULL,
    MODIFY `renavam` VARCHAR(255) NOT NULL,
    MODIFY `plate` VARCHAR(255) NOT NULL,
    MODIFY `fuel_consumption` DOUBLE NOT NULL;
