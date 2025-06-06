/*
  Warnings:

  - Added the required column `bpk_link` to the `passenger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rg_back` to the `passenger` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rg_front` to the `passenger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `passenger` ADD COLUMN `bpk_link` VARCHAR(90) NOT NULL,
    ADD COLUMN `rg_back` VARCHAR(90) NOT NULL,
    ADD COLUMN `rg_front` VARCHAR(90) NOT NULL;
