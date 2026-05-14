ALTER TABLE "Wrap" ADD COLUMN "publicSlug" TEXT;
CREATE UNIQUE INDEX "Wrap_publicSlug_key" ON "Wrap"("publicSlug");
