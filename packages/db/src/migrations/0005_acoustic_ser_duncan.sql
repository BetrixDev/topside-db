ALTER TABLE "items" 
    ALTER COLUMN "craft_bench" DROP DEFAULT, 
    ALTER COLUMN "craft_bench" TYPE jsonb USING "craft_bench"::jsonb, 
    ALTER COLUMN "craft_bench" SET DEFAULT '[]'::jsonb;