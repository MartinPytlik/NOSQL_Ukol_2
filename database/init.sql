-- Inicializační skript pro PostgreSQL databázi
-- Vytvoří tabulku produktů a naplní ji testovacími daty

-- Vytvoření tabulky produktů
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vytvoření indexu pro vyhledávání podle kategorie
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Vytvoření indexu pro vyhledávání podle názvu (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_name ON products(LOWER(name));

-- Funkce pro automatickou aktualizaci updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pro automatickou aktualizaci updated_at při UPDATE
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vložení testovacích dat (seed)
INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
    ('iPhone 15 Pro', 'Nejnovější iPhone s titaniovým rámem a A17 Pro čipem', 32990.00, 'Elektronika', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 50),
    ('MacBook Air M3', 'Ultratenký notebook s čipem Apple M3', 35990.00, 'Elektronika', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 30),
    ('Sony WH-1000XM5', 'Prémiová bezdrátová sluchátka s potlačením hluku', 8990.00, 'Elektronika', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 100),
    ('Samsung Galaxy S24 Ultra', 'Vlajkový smartphone s AI funkcemi a S Pen', 35990.00, 'Elektronika', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 45),
    ('Nike Air Max 90', 'Ikonické tenisky s viditelnou Air jednotkou', 3999.00, 'Obuv', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 200),
    ('Adidas Ultraboost', 'Běžecké boty s Boost technologií', 4499.00, 'Obuv', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', 150),
    ('Levi''s 501 Original', 'Klasické džíny s rovným střihem', 2499.00, 'Oblečení', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 300),
    ('Tommy Hilfiger Polo', 'Elegantní polo triko z bavlny', 1899.00, 'Oblečení', 'https://images.unsplash.com/photo-1625910513413-5fc5e405b934?w=400', 250),
    ('Dyson V15 Detect', 'Bezdrátový vysavač s laserovým detektorem prachu', 18990.00, 'Domácnost', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', 40),
    ('Nespresso Vertuo', 'Kávovar na kapsle s technologií Centrifusion', 4990.00, 'Domácnost', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400', 80),
    ('PlayStation 5', 'Herní konzole nové generace od Sony', 14990.00, 'Hry', 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', 25),
    ('Nintendo Switch OLED', 'Hybridní herní konzole s OLED displejem', 9990.00, 'Hry', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', 60),
    ('The Legend of Zelda: TOTK', 'Akční adventura pro Nintendo Switch', 1699.00, 'Hry', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400', 200),
    ('Kindle Paperwhite', 'E-book čtečka s osvětleným displejem', 3999.00, 'Elektronika', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 120),
    ('Apple Watch Series 9', 'Chytré hodinky s pokročilým zdravotním monitoringem', 11990.00, 'Elektronika', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400', 75),
    ('Ray-Ban Aviator', 'Klasické sluneční brýle pilotního stylu', 3999.00, 'Doplňky', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 180),
    ('Samsonite Spinner 75', 'Velký cestovní kufr s 4 kolečky', 5999.00, 'Cestování', 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=400', 50),
    ('Canon EOS R6 Mark II', 'Profesionální bezzrcadlovka s full-frame senzorem', 64990.00, 'Elektronika', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', 15),
    ('IKEA MALM Postel', 'Moderní postel s úložným prostorem', 7999.00, 'Nábytek', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400', 20),
    ('Weber Spirit E-310', 'Plynový gril pro venkovní grilování', 15990.00, 'Zahrada', 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400', 30);

-- Výpis potvrzení
DO $$
BEGIN
    RAISE NOTICE 'Databáze úspěšně inicializována s % produkty', (SELECT COUNT(*) FROM products);
END $$;

