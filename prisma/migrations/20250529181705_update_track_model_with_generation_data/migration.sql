/*
  Warnings:

  - Added the required column `mood` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tempo` to the `Track` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genre` to the `Track` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrackGenre" AS ENUM ('POP', 'ROCK', 'ELECTRONIC', 'HIP_HOP', 'JAZZ', 'CLASSICAL', 'FOLK', 'REGGAETON', 'BLUES', 'COUNTRY');

-- CreateEnum
CREATE TYPE "TrackMood" AS ENUM ('ALEGRE', 'MELANCOLICO', 'ENERGETICO', 'RELAJANTE', 'ROMANTICO', 'NOSTALGICO', 'MOTIVACIONAL', 'MISTERIOSO', 'EPICO', 'INTIMO', 'FESTIVO', 'CONTEMPLATIVO');

-- CreateEnum
CREATE TYPE "TempoRange" AS ENUM ('VERY_SLOW', 'SLOW', 'MODERATE', 'FAST', 'VERY_FAST');

-- CreateEnum
CREATE TYPE "GenerationMethod" AS ENUM ('PROMPT', 'MELODY', 'LYRICS', 'STYLE');

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "allowCollaborations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fileSize" BIGINT,
ADD COLUMN     "generationId" TEXT,
ADD COLUMN     "generationMethod" "GenerationMethod",
ADD COLUMN     "generationTime" INTEGER,
ADD COLUMN     "lyrics" TEXT,
ADD COLUMN     "mainInstruments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mood" "TrackMood" NOT NULL,
ADD COLUMN     "originalPrompt" TEXT,
ADD COLUMN     "riffusionId" TEXT,
ADD COLUMN     "spectrogramUrl" TEXT,
ADD COLUMN     "tempo" "TempoRange" NOT NULL,
DROP COLUMN "genre",
ADD COLUMN     "genre" "TrackGenre" NOT NULL;

-- CreateIndex
CREATE INDEX "Track_genre_idx" ON "Track"("genre");

-- CreateIndex
CREATE INDEX "Track_mood_idx" ON "Track"("mood");

-- CreateIndex
CREATE INDEX "Track_isPublic_idx" ON "Track"("isPublic");

-- CreateIndex
CREATE INDEX "Track_aiGenerated_idx" ON "Track"("aiGenerated");
