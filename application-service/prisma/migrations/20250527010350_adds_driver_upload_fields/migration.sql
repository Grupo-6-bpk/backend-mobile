/*
  Warnings:

  - Added the required column `bpk_link` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnh` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnh_back` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnh_front` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `driver` ADD COLUMN `bpk_link` VARCHAR(90) NOT NULL,
    ADD COLUMN `cnh` VARCHAR(10) NOT NULL,
    ADD COLUMN `cnh_back` VARCHAR(90) NOT NULL,
    ADD COLUMN `cnh_front` VARCHAR(90) NOT NULL;
