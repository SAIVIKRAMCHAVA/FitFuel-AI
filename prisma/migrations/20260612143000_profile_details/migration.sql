-- Add profile fields used by account registration and profile editing.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

ALTER TABLE "Profile"
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "sex" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
