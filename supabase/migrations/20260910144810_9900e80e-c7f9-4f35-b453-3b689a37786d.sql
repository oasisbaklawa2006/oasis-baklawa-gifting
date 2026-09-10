CREATE TABLE public.website_catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'wix_migration',
  source_product_id text NOT NULL,
  slug text NOT NULL,
  display_name text NOT NULL,
  source_name text,
  sku text,
  category_cue text,
  currency text NOT NULL DEFAULT 'INR',
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  commerce_verified boolean NOT NULL DEFAULT false,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_updated_at timestamp with time zone,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT website_catalog_products_provider_check CHECK (provider IN ('wix_migration','appverse','manual')),
  CONSTRAINT website_catalog_products_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT website_catalog_products_source_unique UNIQUE (provider, source_product_id),
  CONSTRAINT website_catalog_products_slug_unique UNIQUE (slug)
);

CREATE TABLE public.website_catalog_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.website_catalog_products(id) ON DELETE CASCADE,
  source_variant_id text NOT NULL,
  option_label text,
  option_kind text NOT NULL DEFAULT 'single',
  regular_price numeric(12,2),
  current_price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  sku text,
  position integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  commerce_eligible boolean NOT NULL DEFAULT false,
  source_updated_at timestamp with time zone,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT website_catalog_variants_kind_check CHECK (option_kind IN ('single','pack','weight','choice')),
  CONSTRAINT website_catalog_variants_currency_check CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT website_catalog_variants_current_price_check CHECK (current_price > 0),
  CONSTRAINT website_catalog_variants_regular_price_check CHECK (regular_price IS NULL OR regular_price > 0),
  CONSTRAINT website_catalog_variants_source_unique UNIQUE (product_id, source_variant_id)
);

CREATE TABLE public.website_catalog_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  mode text NOT NULL DEFAULT 'batch_upsert',
  status text NOT NULL DEFAULT 'completed',
  products_upserted integer NOT NULL DEFAULT 0,
  variants_upserted integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  note text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT website_catalog_sync_runs_status_check CHECK (status IN ('running','completed','failed','partial'))
);

CREATE INDEX website_catalog_products_verified_idx ON public.website_catalog_products (commerce_verified, published);
CREATE INDEX website_catalog_variants_product_idx ON public.website_catalog_variants (product_id, position);
CREATE INDEX website_catalog_variants_eligible_idx ON public.website_catalog_variants (commerce_eligible, published);
CREATE INDEX website_catalog_sync_runs_recent_idx ON public.website_catalog_sync_runs (created_at DESC);

GRANT ALL ON public.website_catalog_products TO service_role;
GRANT ALL ON public.website_catalog_variants TO service_role;
GRANT ALL ON public.website_catalog_sync_runs TO service_role;

ALTER TABLE public.website_catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_catalog_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_catalog_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER website_catalog_products_set_updated_at
  BEFORE UPDATE ON public.website_catalog_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER website_catalog_variants_set_updated_at
  BEFORE UPDATE ON public.website_catalog_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

WITH seed(slug, display_name, source_name, regular_price, current_price) AS (
  VALUES
    ('rosello-25','Rosello 25','Rosello 25',2259.00,1734.00),
    ('rosello-16','Rosello 16','Rosello 16',1559.00,1194.00),
    ('marine-16','Marine 16','Marine 16',1559.00,1194.00),
    ('pure-spark','Pure Spark','Pure Spark',3999.00,3234.00),
    ('pure-shine','Pure Shine','Pure Shine',2799.00,2142.00),
    ('pure-bliss','Pure Bliss','Pure Bliss',1559.00,1194.00),
    ('fern-25','Fern 25','Fern 25',2179.00,1674.00),
    ('noir-treat','Noir Treat','Noir Treat',4289.00,3294.00),
    ('noir-grande','Noir Grande','Noir Grande',4159.00,3198.00),
    ('tote-allure','Tote Allure','Tote Allure’',3949.00,3018.00),
    ('craft','Craft','Craft',3899.00,2994.00),
    ('crownmate','Crownmate','Crownmate',3579.00,2754.00),
    ('sweet-symphony','Sweet Symphony','Sweet Symphony',2339.00,1794.00),
    ('gourmet-delight-assortment','Gourmet Delight Assortment','Gourmet Delight Assortment',NULL,2195.00),
    ('grand-gourmet-assortment','Grand Gourmet Assortment','Grand Gourmet Assortment',NULL,3995.00),
    ('premium-baklava-assortment','Premium Baklava Assortment','Premium Baklava Assortment',NULL,3195.00)
), inserted AS (
  INSERT INTO public.website_catalog_products
    (provider, source_product_id, slug, display_name, source_name, currency, published, commerce_verified, provenance, source_updated_at)
  SELECT 'wix_migration', seed.slug, seed.slug, seed.display_name, seed.source_name, 'INR', true, true,
         jsonb_build_object(
           'source','wix_stores_catalog_v1',
           'wix_site_id','880c7f4f-83ac-46aa-ac0c-5814cb68a3c8',
           'audit_date','2026-09-10',
           'price_verified',true,
           'weight_verified',false
         ),
         '2026-09-10T00:00:00Z'::timestamptz
  FROM seed
  RETURNING id, slug
)
INSERT INTO public.website_catalog_variants
  (product_id, source_variant_id, option_label, option_kind, regular_price, current_price, currency, position, published, commerce_eligible, source_updated_at)
SELECT inserted.id, 'v-1', NULL, 'single', seed.regular_price, seed.current_price, 'INR', 0, true, true,
       '2026-09-10T00:00:00Z'::timestamptz
FROM inserted JOIN seed ON seed.slug = inserted.slug;

INSERT INTO public.website_catalog_sync_runs
  (provider, mode, status, products_upserted, variants_upserted, rejected, note, finished_at)
VALUES
  ('wix_migration','seed','completed',16,16,0,'Curated verified Wix Catalog V1 pricing seed (audit 2026-09-10). Remaining Wix products awaiting batch import.', now());