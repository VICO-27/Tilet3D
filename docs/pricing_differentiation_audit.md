# Tilet3D — Catalog Price Differentiation Audit & Proposal (Phase 0.5)

## Executive Summary

A complete catalog pricing audit was conducted across all **227 active products** and their **227 active variants** in the Tilet3D PostgreSQL database.
The audit identified that **191 products across 13 categories plus 19 standard Kemis dresses** had been assigned flat, identical placeholder prices (e.g. all Shemiz at 3,800 ETB, all Suri at 2,800 ETB, all Wedding attire at 12,000 ETB).
Only **20 luxury bespoke Kemis** pieces had differentiated pricing (22,000 to 31,000 ETB), which are preserved completely unchanged.

### Key Findings
1. **Authoritative Selling Price Field**: Stored exclusively on `ProductVariant.price` (`DecimalField(max_digits=10, decimal_places=2)`). `Product` has no price column; `ProductSerializer` and `ProductListSerializer` dynamically annotate `min_price` or read `variants.first().price`.
2. **Historical Order Immutability**: Historical orders store `price` directly on `OrderItem.price` at checkout snapshot. Updating `ProductVariant.price` does not recalculate or alter existing orders, subtotals, or Chapa payment amounts.
3. **Embeddings Decoupling**: Gemini embeddings (`ProductEmbedding.embedding`) encode only `name`, `category.name`, and `description`. Price is retrieved dynamically at search/chat runtime via `ProductVariant.price`. Vector embeddings remain fully valid.

## Category Distribution Summary (Before vs. Proposed)

| Category | Total Products | Current Price Range (ETB) | Distinct Tiers (Before) | Proposed Price Range (ETB) | Distinct Tiers (Proposed) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Accessories** | 10 | 750.00 – 750.00 | 1 | 550.00 – 1,400.00 | 9 | Differentiated |
| **Amhara** | 10 | 4,000.00 – 4,000.00 | 1 | 3,400.00 – 5,200.00 | 9 | Differentiated |
| **Couple** | 10 | 7,800.00 – 7,800.00 | 1 | 6,800.00 – 10,500.00 | 10 | Differentiated |
| **Family** | 10 | 9,500.00 – 9,500.00 | 1 | 8,800.00 – 11,500.00 | 9 | Differentiated |
| **Gabi** | 10 | 2,200.00 – 2,200.00 | 1 | 1,800.00 – 3,200.00 | 9 | Differentiated |
| **Kemis** | 55 | 5,200.00 – 31,000.00 | 16 | 4,200.00 – 31,000.00 | 34 | Preserved + Differentiated |
| **Netela** | 10 | 1,800.00 – 1,800.00 | 1 | 1,400.00 – 2,600.00 | 9 | Differentiated |
| **Oromo** | 16 | 4,500.00 – 4,500.00 | 1 | 3,800.00 – 5,800.00 | 14 | Differentiated |
| **Scarf** | 20 | 950.00 – 950.00 | 1 | 750.00 – 1,400.00 | 14 | Differentiated |
| **Shash** | 10 | 850.00 – 850.00 | 1 | 650.00 – 1,350.00 | 9 | Differentiated |
| **Shemiz** | 26 | 3,800.00 – 3,800.00 | 1 | 3,200.00 – 6,500.00 | 13 | Differentiated |
| **Suri** | 19 | 2,800.00 – 2,800.00 | 1 | 2,400.00 – 3,500.00 | 11 | Differentiated |
| **Tigray** | 9 | 4,200.00 – 4,200.00 | 1 | 3,600.00 – 5,400.00 | 8 | Differentiated |
| **Wedding** | 12 | 12,000.00 – 12,000.00 | 1 | 9,500.00 – 18,500.00 | 12 | Differentiated |

---

## Proposed Price Modifications by Category

### Category: Accessories (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Heritage Cultural Accessory #1 | `TLT-ACC-102D29` | `e7980cc2-71b1-4b45-b71f-ffb1ffc51143` | 750.00 | **550.00** | -200.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #2 | `TLT-ACC-EE2CE5` | `600b9216-dd05-491d-9ab8-d4b5e35702a7` | 750.00 | **600.00** | -150.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #3 | `TLT-ACC-49766B` | `8869bb42-34e7-4fac-bb26-1b37db80164c` | 750.00 | **650.00** | -100.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #4 | `TLT-ACC-C4ACA9` | `ee0ef88a-783e-48ed-8e28-e8241c657354` | 750.00 | **750.00** | 0.00 (Baseline) | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #5 | `TLT-ACC-11DE2F` | `6ad2eef5-0778-47b4-9e13-2185ba991aac` | 750.00 | **750.00** | 0.00 (Baseline) | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #6 | `TLT-ACC-87F982` | `c6a8ffd5-1548-432d-9bc3-9f53fbf3aa12` | 750.00 | **850.00** | +100.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #7 | `TLT-ACC-6685F3` | `e33f8fde-5ffd-474d-b8c6-e0ebedc9b815` | 750.00 | **950.00** | +200.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #8 | `TLT-ACC-474CA8` | `535a5e8e-43e4-484a-ad67-a84dd4ed1c73` | 750.00 | **1,100.00** | +350.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #9 | `TLT-ACC-206F4A` | `213fba1e-7ef9-4d81-8d41-9170bd07dcdf` | 750.00 | **1,250.00** | +500.00 | Differentiate Accessories catalog tier |
| Heritage Cultural Accessory #10 | `TLT-ACC-9D9E2A` | `f69bdaee-646a-4768-9ec1-c1ad87c168e8` | 750.00 | **1,400.00** | +650.00 | Differentiate Accessories catalog tier |


### Category: Amhara (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Amhara Traditional Couture Dress #1 | `TLT-AMH-A54F2A` | `9654f9cd-6cb2-4309-9b09-21a575f94008` | 4,000.00 | **3,400.00** | -600.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #2 | `TLT-AMH-AA7F01` | `77eb66e2-8ceb-48f5-98ac-89f5f84e58ea` | 4,000.00 | **3,600.00** | -400.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #3 | `TLT-AMH-A90F06` | `cceff2ab-0c3d-4413-8df1-e6bcff0f8701` | 4,000.00 | **3,800.00** | -200.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #4 | `TLT-AMH-4B7A7D` | `76bfb758-35a9-4ebc-bfad-63464bacce5c` | 4,000.00 | **4,000.00** | 0.00 (Baseline) | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #5 | `TLT-AMH-E00A34` | `5a116893-3b7b-4e0b-98b4-cbc1eb3ae89e` | 4,000.00 | **4,000.00** | 0.00 (Baseline) | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #6 | `TLT-AMH-7EFA2E` | `35782c90-2219-4c9f-ae2f-457611015efb` | 4,000.00 | **4,200.00** | +200.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #7 | `TLT-AMH-BD6CD9` | `ac27e436-a748-4e89-bf9b-a8d0662a88a7` | 4,000.00 | **4,400.00** | +400.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #8 | `TLT-AMH-DFD813` | `4674f692-1ded-41d2-8aa3-c96cd422b740` | 4,000.00 | **4,700.00** | +700.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #9 | `TLT-AMH-A0DED9` | `6ba27765-ac9d-4193-9555-86672baceab0` | 4,000.00 | **4,900.00** | +900.00 | Differentiate Amhara catalog tier |
| Amhara Traditional Couture Dress #10 | `TLT-AMH-CAF546` | `88b3a119-1346-4688-b23a-1e23e039b9ed` | 4,000.00 | **5,200.00** | +1,200.00 | Differentiate Amhara catalog tier |


### Category: Couple (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Harmonized Couple Ensemble #1 | `TLT-COU-B1CE36` | `5757dbc2-78bc-4f62-8b61-18b210256f2d` | 7,800.00 | **6,800.00** | -1,000.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #2 | `TLT-COU-3B1CF6` | `de5b6cb5-c3d2-4d93-acd0-25d447131f31` | 7,800.00 | **7,200.00** | -600.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #3 | `TLT-COU-3DC926` | `e4d25a39-8103-45f1-85b2-1c023c54a848` | 7,800.00 | **7,500.00** | -300.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #4 | `TLT-COU-611E92` | `a94f1bf7-5b97-44d3-9382-4b818eb9891a` | 7,800.00 | **7,800.00** | 0.00 (Baseline) | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #5 | `TLT-COU-808CB5` | `7cfa3303-c30b-4c2b-b148-eb8d186ad77d` | 7,800.00 | **8,000.00** | +200.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #6 | `TLT-COU-83DEE1` | `4d13feea-a9d1-4f55-ac15-6541b7575d0e` | 7,800.00 | **8,400.00** | +600.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #7 | `TLT-COU-75AF5F` | `ef91e3b7-539e-49ea-9e65-4d43af4c5884` | 7,800.00 | **8,800.00** | +1,000.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #8 | `TLT-COU-85EB8F` | `d7e46777-a8c7-4cfe-8356-b36c36bb0203` | 7,800.00 | **9,400.00** | +1,600.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #9 | `TLT-COU-23BC75` | `39b7c128-c578-4483-b4ab-353633202355` | 7,800.00 | **9,800.00** | +2,000.00 | Differentiate Couple catalog tier |
| Harmonized Couple Ensemble #10 | `TLT-COU-5DF38B` | `4a24c28c-2313-4e64-b613-70373bf77401` | 7,800.00 | **10,500.00** | +2,700.00 | Differentiate Couple catalog tier |


### Category: Family (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Black Family Habesha Set | `TLT-FAM-8C4553` | `de5966db-5518-4f2f-8a4f-a523c6207f16` | 9,500.00 | **8,800.00** | -700.00 | Differentiate Family catalog tier |
| Black White Family Habesha Set | `TLT-FAM-4D7ACE` | `c9dbac17-f482-47af-b89d-c8bc55f40cc5` | 9,500.00 | **9,000.00** | -500.00 | Differentiate Family catalog tier |
| Red Family Habesha Set | `TLT-FAM-D7C323` | `11844409-4441-4add-ae0e-f625d841c480` | 9,500.00 | **9,200.00** | -300.00 | Differentiate Family catalog tier |
| Green Family Habesha Set | `TLT-FAM-FB5344` | `3aa3e92e-f541-471a-8953-934abc2e45d1` | 9,500.00 | **9,500.00** | 0.00 (Baseline) | Differentiate Family catalog tier |
| Green2 Family Habesha Set | `TLT-FAM-D5EA69` | `c51d563e-8584-484d-98b1-9a8f75122105` | 9,500.00 | **9,500.00** | 0.00 (Baseline) | Differentiate Family catalog tier |
| Light Green Family Habesha Set | `TLT-FAM-AC2AD8` | `e85c034b-5861-4e64-bbb6-02e9080f7ac9` | 9,500.00 | **9,800.00** | +300.00 | Differentiate Family catalog tier |
| Light Yellow Family Habesha Set | `TLT-FAM-1717CA` | `e464cf8f-7617-425a-b4f5-c564230ac52d` | 9,500.00 | **10,200.00** | +700.00 | Differentiate Family catalog tier |
| Orange Family Habesha Set | `TLT-FAM-B2F35C` | `94f089f8-5240-4d39-b188-4c5ca8ea3b3d` | 9,500.00 | **10,500.00** | +1,000.00 | Differentiate Family catalog tier |
| Yellow Family Habesha Set | `TLT-FAM-12F0F4` | `8fa3487f-ff40-4ed8-b991-0dea7dd1e923` | 9,500.00 | **10,800.00** | +1,300.00 | Differentiate Family catalog tier |
| Gold Family Habesha Set | `TLT-FAM-A269C4` | `a8b884e2-3e13-41ab-9cc5-d0a34f7be1ae` | 9,500.00 | **11,500.00** | +2,000.00 | Differentiate Family catalog tier |


### Category: Gabi (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Pure Cotton Artisanal Gabi #1 | `TLT-GAB-8497AC` | `fe34efc7-1b70-4e9d-b9a7-fa125bd28008` | 2,200.00 | **1,800.00** | -400.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #2 | `TLT-GAB-76005C` | `0d350a62-097e-4770-a1d8-29f2960498fd` | 2,200.00 | **1,900.00** | -300.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #3 | `TLT-GAB-5D9330` | `eae71876-0f2a-4e13-9bf8-6921c39c8d9c` | 2,200.00 | **2,000.00** | -200.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #4 | `TLT-GAB-1F8FCE` | `c6cbe3fe-bdd2-4c54-883e-a711c0ae4f1d` | 2,200.00 | **2,200.00** | 0.00 (Baseline) | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #5 | `TLT-GAB-E8DCB1` | `4c434255-d7dd-4d4d-817c-a166038817f9` | 2,200.00 | **2,200.00** | 0.00 (Baseline) | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #6 | `TLT-GAB-49E755` | `b705399a-44d7-46b7-9d4d-5a2866a166a3` | 2,200.00 | **2,400.00** | +200.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #7 | `TLT-GAB-0A9B97` | `79791977-7344-441b-bed5-c5d8785c834e` | 2,200.00 | **2,500.00** | +300.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #8 | `TLT-GAB-46469B` | `4b03aa24-71f5-4f0f-b93a-a49e45f9aee2` | 2,200.00 | **2,700.00** | +500.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #9 | `TLT-GAB-0B6884` | `a2a799d2-5dd4-4246-961d-9ecabbdf98b3` | 2,200.00 | **2,900.00** | +700.00 | Differentiate Gabi catalog tier |
| Pure Cotton Artisanal Gabi #10 | `TLT-GAB-DDCA95` | `1b0f9e31-1a06-4561-b457-91be7f97449e` | 2,200.00 | **3,200.00** | +1,000.00 | Differentiate Gabi catalog tier |


### Category: Kemis (35 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Brown Kemis | `TLT-KEM-7F8F21` | `31dbf69d-ad4f-456e-abbb-6684ff835b63` | 5,200.00 | **4,200.00** | -1,000.00 | Differentiate Kemis catalog tier |
| Black Habesha Kemis | `TLT-KEM-A53215` | `49d74197-c8cb-4cb0-b202-5dd177127f72` | 5,200.00 | **4,500.00** | -700.00 | Differentiate Kemis catalog tier |
| Blue Kemis | `TLT-KEM-50A78C` | `df2779b0-2f68-428b-ae4e-543e34604260` | 5,200.00 | **4,800.00** | -400.00 | Differentiate Kemis catalog tier |
| Green Kemis | `TLT-KEM-7792FF` | `29309b4c-87a9-44e2-a7df-42e127020372` | 5,200.00 | **4,800.00** | -400.00 | Differentiate Kemis catalog tier |
| Red Kemis | `TLT-KEM-941E8B` | `cd3dcfad-a3bb-4ca0-8939-ebafa38db0e4` | 5,200.00 | **4,800.00** | -400.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #1 | `TLT-KEM-253A5E` | `0877b5fa-0390-4cdf-ab58-a0761452bd18` | 5,200.00 | **4,900.00** | -300.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #2 | `TLT-KEM-E441BF` | `071b3855-0bf6-4a16-8c19-03998f96aa2a` | 5,200.00 | **5,000.00** | -200.00 | Differentiate Kemis catalog tier |
| Blue Habesha Kemis | `TLT-KEM-E70DAD` | `5fb3f0ad-a0bb-40da-8e3c-8401329db401` | 5,200.00 | **5,200.00** | 0.00 (Baseline) | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #3 | `TLT-KEM-32549D` | `69dd674c-5064-467d-9a38-1dac7200bf5a` | 5,200.00 | **5,200.00** | 0.00 (Baseline) | Differentiate Kemis catalog tier |
| Red Habesha Kemis | `TLT-KEM-221778` | `32c5e412-4310-40d3-8d36-941da95c874d` | 5,200.00 | **5,200.00** | 0.00 (Baseline) | Differentiate Kemis catalog tier |
| Red2 Kemis | `TLT-KEM-5B6170` | `20269d34-3e70-44d0-b00a-04de37cd4501` | 5,200.00 | **5,200.00** | 0.00 (Baseline) | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #4 | `TLT-KEM-410187` | `673ede99-dece-4685-a889-8abf982f3353` | 5,200.00 | **5,400.00** | +200.00 | Differentiate Kemis catalog tier |
| Green Habesha Kemis | `TLT-KEM-7595AB` | `faef325a-9407-44e5-b684-cd469385d0a2` | 5,200.00 | **5,400.00** | +200.00 | Differentiate Kemis catalog tier |
| Green2 Kemis | `TLT-KEM-11DB21` | `41e3ae77-2f7c-4b6e-bdb0-de31d7cf850b` | 5,200.00 | **5,400.00** | +200.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #5 | `TLT-KEM-217910` | `00e15d97-ab59-4da5-85c7-2a58ecf10078` | 5,200.00 | **5,600.00** | +400.00 | Differentiate Kemis catalog tier |
| Lemon Kemis | `TLT-KEM-541FEA` | `c2fe5c0f-c69d-4000-873b-9f9e9733c041` | 5,200.00 | **5,600.00** | +400.00 | Differentiate Kemis catalog tier |
| Pink Habesha Kemis | `TLT-KEM-304770` | `2f21978c-1e33-4d92-86df-af71b4b5ff5b` | 5,200.00 | **5,600.00** | +400.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #6 | `TLT-KEM-ECDF90` | `3a105640-30eb-4848-82f4-1fa22cb626db` | 5,200.00 | **5,800.00** | +600.00 | Differentiate Kemis catalog tier |
| Purple Kemis | `TLT-KEM-457BFD` | `cf649ece-3aa2-4c12-8060-df5ec376eb00` | 5,200.00 | **5,800.00** | +600.00 | Differentiate Kemis catalog tier |
| Yellow Habesha Kemis | `TLT-KEM-A05470` | `2fbcaf8d-8ad6-4f6b-8ec6-358aed80c433` | 5,200.00 | **5,800.00** | +600.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #7 | `TLT-KEM-FE5208` | `944457de-7f4e-4cd8-b474-690bf0888285` | 5,200.00 | **6,000.00** | +800.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #8 | `TLT-KEM-250286` | `b0dfea4b-f2a0-42f2-8a46-dae9a20bf7c5` | 5,200.00 | **6,200.00** | +1,000.00 | Differentiate Kemis catalog tier |
| Lemon Habesha Kemis | `TLT-KEM-AE964A` | `bcbf5713-8c82-4fe1-950f-bfb1c7a06618` | 5,200.00 | **6,200.00** | +1,000.00 | Differentiate Kemis catalog tier |
| Red3 Kemis | `TLT-KEM-A848FF` | `7fd47c19-80a5-43df-b7f0-5564dd240797` | 5,200.00 | **6,200.00** | +1,000.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #9 | `TLT-KEM-5F5CB1` | `4f59cc3d-f74c-48b5-ab5c-4b8831c92da0` | 5,200.00 | **6,400.00** | +1,200.00 | Differentiate Kemis catalog tier |
| Purple Habesha Kemis | `TLT-KEM-99A69D` | `897cc634-6ca8-4636-867a-dcb54db4113a` | 5,200.00 | **6,400.00** | +1,200.00 | Differentiate Kemis catalog tier |
| Teal Blue Habesha Kemis | `TLT-KEM-382604` | `8cc12711-c23f-4c37-8070-d57e0d14c96a` | 5,200.00 | **6,500.00** | +1,300.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #10 | `TLT-KEM-F4597F` | `6dea6353-8b02-43d4-9434-f093730b6e2a` | 5,200.00 | **6,600.00** | +1,400.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #11 | `TLT-KEM-86681A` | `76e30b99-31da-4166-bcdb-09b238432a84` | 5,200.00 | **6,800.00** | +1,600.00 | Differentiate Kemis catalog tier |
| Gold Habesha Kemis | `TLT-KEM-87584E` | `9ce1f550-b79c-4bab-9349-bf2e1386aa4f` | 5,200.00 | **6,800.00** | +1,600.00 | Differentiate Kemis catalog tier |
| Gold Kemis | `TLT-KEM-BF838B` | `14a8db11-dee1-4707-b5de-c72a7e04afad` | 5,200.00 | **6,800.00** | +1,600.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #12 | `TLT-KEM-FE9709` | `88cfa9c5-c9cf-4381-948f-a50e87afc79f` | 5,200.00 | **7,000.00** | +1,800.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #13 | `TLT-KEM-D5E40D` | `a26e3fd2-db30-4a59-b11f-bc2be316d2d8` | 5,200.00 | **7,200.00** | +2,000.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #14 | `TLT-KEM-BF688C` | `b9a9f435-7fd1-4d62-b754-3e300110413b` | 5,200.00 | **7,400.00** | +2,200.00 | Differentiate Kemis catalog tier |
| Couture Habesha Kemis Collection #15 | `TLT-KEM-969F51` | `2a393f16-ac93-4a79-9608-59bf073a1b7c` | 5,200.00 | **7,500.00** | +2,300.00 | Differentiate Kemis catalog tier |


### Category: Netela (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Handcrafted Fine Netela #1 | `TLT-NET-BC9AB6` | `fcaf8495-f985-4757-ae09-bef80897376d` | 1,800.00 | **1,400.00** | -400.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #2 | `TLT-NET-B065DA` | `b553815f-7af2-4c29-8922-1cdca9eaa110` | 1,800.00 | **1,500.00** | -300.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #3 | `TLT-NET-598738` | `5975f684-7dc1-444c-9bd3-3c49671629af` | 1,800.00 | **1,600.00** | -200.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #4 | `TLT-NET-FA3910` | `d17eec3b-3fef-45f2-8b11-d2582dec72cb` | 1,800.00 | **1,800.00** | 0.00 (Baseline) | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #5 | `TLT-NET-B81ED0` | `4a2aabf9-ee76-46c9-ab8f-aefb0f56325f` | 1,800.00 | **1,800.00** | 0.00 (Baseline) | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #6 | `TLT-NET-B53229` | `7e78c6c5-7db1-4f92-b263-36796bcd5e98` | 1,800.00 | **1,900.00** | +100.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #7 | `TLT-NET-085C9D` | `950c6fdc-88ae-4669-b138-1cf7cf393f1a` | 1,800.00 | **2,000.00** | +200.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #8 | `TLT-NET-7B9CCA` | `7b218fcc-c767-4dbf-8010-2e4289b90fc7` | 1,800.00 | **2,200.00** | +400.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #9 | `TLT-NET-C17475` | `ebdefa5f-49a4-40f3-a7cd-7d42d2a4b75c` | 1,800.00 | **2,400.00** | +600.00 | Differentiate Netela catalog tier |
| Handcrafted Fine Netela #10 | `TLT-NET-373FAA` | `3653026c-6d4e-4782-8d07-00caf47c8b18` | 1,800.00 | **2,600.00** | +800.00 | Differentiate Netela catalog tier |


### Category: Oromo (16 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Authentic Oromo Cultural Wear #1 | `TLT-ORO-C843B6` | `ca288144-cd42-4428-be69-55893bc28906` | 4,500.00 | **3,800.00** | -700.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #2 | `TLT-ORO-78D0CD` | `1e3ada2b-7eac-4b80-869e-bdf1c178964d` | 4,500.00 | **3,900.00** | -600.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #3 | `TLT-ORO-384202` | `d7b96743-2f4a-41de-bad1-efaf46b5672a` | 4,500.00 | **4,000.00** | -500.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #4 | `TLT-ORO-7A26E1` | `0efaa443-0709-454a-bd37-5c2860138bfc` | 4,500.00 | **4,200.00** | -300.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #5 | `TLT-ORO-F34B1E` | `689b68eb-36ff-4135-9ad0-4ae747edd22f` | 4,500.00 | **4,400.00** | -100.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #6 | `TLT-ORO-2C516E` | `a2f8f64f-4d51-4ca5-93ea-ee78bc702f4e` | 4,500.00 | **4,500.00** | 0.00 (Baseline) | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #7 | `TLT-ORO-77FC7F` | `d4d47fad-0c90-4c76-9be9-862f55b39e01` | 4,500.00 | **4,500.00** | 0.00 (Baseline) | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #8 | `TLT-ORO-AA029F` | `f761f5ec-4de8-4b67-b7a4-70b6eb93bae4` | 4,500.00 | **4,600.00** | +100.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #9 | `TLT-ORO-E6F8DF` | `8cefd6ec-f1fd-4b55-b45e-4b640d4ac965` | 4,500.00 | **4,700.00** | +200.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #10 | `TLT-ORO-FE7054` | `1165d099-db57-4182-b99a-b43b53c9c716` | 4,500.00 | **4,800.00** | +300.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #11 | `TLT-ORO-56A9ED` | `688c8e30-f416-4bc5-bc69-df47475187e4` | 4,500.00 | **4,800.00** | +300.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #12 | `TLT-ORO-24D4C2` | `1becee78-5263-44b1-a000-362e11a26372` | 4,500.00 | **5,100.00** | +600.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #13 | `TLT-ORO-F94C17` | `02aaed6f-604d-4e05-9159-25f4b84b0cc4` | 4,500.00 | **5,200.00** | +700.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #14 | `TLT-ORO-731D77` | `e5e77ecd-a585-4c48-953d-c9fb55f135f7` | 4,500.00 | **5,400.00** | +900.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #15 | `TLT-ORO-F817DD` | `aecfe5b1-3fee-4169-99db-388bcf3bb093` | 4,500.00 | **5,600.00** | +1,100.00 | Differentiate Oromo catalog tier |
| Authentic Oromo Cultural Wear #16 | `TLT-ORO-E4F934` | `c9d2843b-7e8b-42af-8689-6f3cd3e58bec` | 4,500.00 | **5,800.00** | +1,300.00 | Differentiate Oromo catalog tier |


### Category: Scarf (20 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Handwoven Traditional Scarf #1 | `TLT-SCA-E69A83` | `ac89e83b-7bc6-43d0-a1f8-345232c1c876` | 950.00 | **750.00** | -200.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #2 | `TLT-SCA-79A662` | `67dbe2c1-01e1-47f3-b933-21093cd1bc06` | 950.00 | **750.00** | -200.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #3 | `TLT-SCA-79029C` | `8c2f0d2b-a219-4ef3-b774-c58b8c495fe3` | 950.00 | **800.00** | -150.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #4 | `TLT-SCA-47E03F` | `144eaa01-01c9-4fcf-8964-c61d6d8a2368` | 950.00 | **800.00** | -150.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #5 | `TLT-SCA-8AA6A2` | `5adf6d4b-103e-49c4-9988-ac0e65dea0c6` | 950.00 | **850.00** | -100.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #6 | `TLT-SCA-72A5FB` | `6f403cab-0a61-475f-b816-7448d7008f2f` | 950.00 | **900.00** | -50.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #7 | `TLT-SCA-085B00` | `68deb4ca-36eb-4619-8ce5-641ce9d5747f` | 950.00 | **950.00** | 0.00 (Baseline) | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #8 | `TLT-SCA-A5F8DB` | `3a3d5feb-c87e-436d-98c5-baed8f95e55e` | 950.00 | **950.00** | 0.00 (Baseline) | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #10 | `TLT-SCA-783C5A` | `b7e70687-7f18-4075-8b1c-d26ac2eb4268` | 950.00 | **1,000.00** | +50.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #9 | `TLT-SCA-3680AF` | `0613e48b-78fa-4d68-8e7d-0df35b7ad386` | 950.00 | **1,000.00** | +50.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #11 | `TLT-SCA-FA86C7` | `da4282ae-b924-4bd9-8439-c31bd25d867c` | 950.00 | **1,050.00** | +100.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #12 | `TLT-SCA-98D2A4` | `923e9151-9e6d-47ff-ae4f-e4e5503a9db9` | 950.00 | **1,050.00** | +100.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #13 | `TLT-SCA-B9348B` | `ea91f97f-21c9-4749-912c-d5d47891089e` | 950.00 | **1,100.00** | +150.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #14 | `TLT-SCA-C8BB7B` | `5cb66af9-b284-4852-944f-b40a0c387e42` | 950.00 | **1,100.00** | +150.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #15 | `TLT-SCA-4D11F0` | `267b11ba-0d90-4cd0-87d5-ac3f103013e2` | 950.00 | **1,150.00** | +200.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #16 | `TLT-SCA-A5FB9F` | `50ca5bd1-e8fe-4955-b69c-e4b0277b9063` | 950.00 | **1,200.00** | +250.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #17 | `TLT-SCA-9E5ACE` | `619373c1-c8f9-483c-9e08-539e3644303d` | 950.00 | **1,250.00** | +300.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #18 | `TLT-SCA-16D2D3` | `641035c1-7fb3-4aab-b8fe-0d1039ebe871` | 950.00 | **1,300.00** | +350.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #19 | `TLT-SCA-0A7C5D` | `5d71f131-9d45-468d-bfa1-55717c87e799` | 950.00 | **1,350.00** | +400.00 | Differentiate Scarf catalog tier |
| Handwoven Traditional Scarf #20 | `TLT-SCA-8AC995` | `4dda8c3b-f06f-4226-831f-79b7418c1147` | 950.00 | **1,400.00** | +450.00 | Differentiate Scarf catalog tier |


### Category: Shash (10 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Traditional Silk & Cotton Shash #1 | `TLT-SHA-C8435F` | `3d0d63f9-7bad-41f6-b056-723fe43964c4` | 850.00 | **650.00** | -200.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #2 | `TLT-SHA-67BAA0` | `385f468d-7e6e-46a6-a462-eb87d1b36dba` | 850.00 | **700.00** | -150.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #3 | `TLT-SHA-42FBC4` | `be88a27c-2ccf-4df2-a1d4-d552dfc19fcd` | 850.00 | **750.00** | -100.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #4 | `TLT-SHA-510715` | `e161787b-cbbf-4a1d-ab0f-b0abbb6d8b7e` | 850.00 | **850.00** | 0.00 (Baseline) | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #5 | `TLT-SHA-1A756C` | `f42d9965-85b8-4fd5-9095-483e603d9fde` | 850.00 | **850.00** | 0.00 (Baseline) | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #6 | `TLT-SHA-EC6C6A` | `864a8102-f81f-4e76-92d7-144e98883bd1` | 850.00 | **900.00** | +50.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #7 | `TLT-SHA-6D8982` | `b5be9e40-39f9-460f-aecc-a2e9895e2e9d` | 850.00 | **950.00** | +100.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #8 | `TLT-SHA-3C53D8` | `6be1dcc2-cebc-4197-bb80-581a34f3b735` | 850.00 | **1,100.00** | +250.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #9 | `TLT-SHA-0F1C75` | `059044be-c856-4ac2-b2a1-8fc6f2d663cc` | 850.00 | **1,200.00** | +350.00 | Differentiate Shash catalog tier |
| Traditional Silk & Cotton Shash #10 | `TLT-SHA-3B2B03` | `fda3e710-39b6-4cef-bee1-9830ba940e7c` | 850.00 | **1,350.00** | +500.00 | Differentiate Shash catalog tier |


### Category: Shemiz (26 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Tailored Shemiz 1 | `TLT-SHE-A81C08` | `01fb692d-acf7-4ef0-a3e9-459778b4a870` | 3,800.00 | **3,200.00** | -600.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 2 | `TLT-SHE-B7E062` | `48f11866-9b58-4bef-96cb-1c7628e78c1f` | 3,800.00 | **3,200.00** | -600.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 3 | `TLT-SHE-1ED01F` | `a2038f1b-1e0e-4826-b53f-fbd7052cceeb` | 3,800.00 | **3,400.00** | -400.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 4 | `TLT-SHE-57F035` | `9e45941c-69be-41b5-9199-29883204058e` | 3,800.00 | **3,400.00** | -400.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 5 | `TLT-SHE-1EF476` | `dfb425e2-2402-46f3-9dcc-c7d9056e4f9e` | 3,800.00 | **3,500.00** | -300.00 | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #1 | `TLT-SHE-4FA87A` | `7d32aba1-9b4a-4949-b6d2-a397cb5e03c5` | 3,800.00 | **3,800.00** | 0.00 (Baseline) | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #2 | `TLT-SHE-AE0F19` | `5ec49634-b157-44b3-876e-ad98d1684f4a` | 3,800.00 | **3,800.00** | 0.00 (Baseline) | Differentiate Shemiz catalog tier |
| Tailored Shemiz 6 | `TLT-SHE-CDA69B` | `a466b0a9-034f-4da2-93be-2f7442859773` | 3,800.00 | **3,800.00** | 0.00 (Baseline) | Differentiate Shemiz catalog tier |
| Tailored Shemiz 7 | `TLT-SHE-D72C2C` | `07df6f7a-69ee-4594-8111-28897f1ffae8` | 3,800.00 | **3,800.00** | 0.00 (Baseline) | Differentiate Shemiz catalog tier |
| Tailored Shemiz 8 | `TLT-SHE-1AA77B` | `91c7a3e8-0fa0-44f6-aedb-656fbc41c60e` | 3,800.00 | **3,800.00** | 0.00 (Baseline) | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #3 | `TLT-SHE-D59752` | `ba9b300b-e386-4699-8e6a-5bd544cec3e5` | 3,800.00 | **4,000.00** | +200.00 | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #4 | `TLT-SHE-E1C35F` | `3581dac4-018f-4de8-a78a-b3defa5cb6c5` | 3,800.00 | **4,000.00** | +200.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 10 | `TLT-SHE-B6A855` | `767f967a-ba8a-414b-86e2-74dc185151bd` | 3,800.00 | **4,000.00** | +200.00 | Differentiate Shemiz catalog tier |
| Tailored Shemiz 9 | `TLT-SHE-DE4715` | `2621f3ac-1524-4b5d-8f89-c79fd2ce9b3b` | 3,800.00 | **4,000.00** | +200.00 | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #5 | `TLT-SHE-D538BA` | `05bd0af9-2ec3-4f84-af76-525836fcb5fc` | 3,800.00 | **4,200.00** | +400.00 | Differentiate Shemiz catalog tier |
| Artisanal Men Shemiz #6 | `TLT-SHE-3C2691` | `d4f68943-e4a7-4376-9f71-2885600293a4` | 3,800.00 | **4,200.00** | +400.00 | Differentiate Shemiz catalog tier |
| Tailored Blue Shemiz | `TLT-SHE-A0B326` | `489e442c-5b1b-4568-846b-cb006e48b0b1` | 3,800.00 | **4,400.00** | +600.00 | Differentiate Shemiz catalog tier |
| Tailored Red Shemiz | `TLT-SHE-948185` | `a5dfdb65-d07f-4415-ba13-c7628ff2ffb9` | 3,800.00 | **4,400.00** | +600.00 | Differentiate Shemiz catalog tier |
| Tailored Red2 Shemiz | `TLT-SHE-0C34CB` | `fdae7b89-ba3d-42c3-ac8b-dcddba7112e9` | 3,800.00 | **4,500.00** | +700.00 | Differentiate Shemiz catalog tier |
| Tailored Dark Green Shemiz | `TLT-SHE-A4E5AA` | `5affee21-9b9f-44ec-9155-7efc176a13c9` | 3,800.00 | **4,600.00** | +800.00 | Differentiate Shemiz catalog tier |
| Tailored Light Purple Gold Shemiz | `TLT-SHE-93C17E` | `c16533a5-a7ff-4ac1-b277-69c26caef1c2` | 3,800.00 | **4,800.00** | +1,000.00 | Differentiate Shemiz catalog tier |
| Tailored Yellow Gold Shemiz | `TLT-SHE-934F91` | `bdd102a8-1ccb-4a21-a564-016e3b3a0ada` | 3,800.00 | **4,800.00** | +1,000.00 | Differentiate Shemiz catalog tier |
| Tailored Gold 2 | `TLT-SHE-BC5390` | `a1004767-f6b5-45da-aca1-99987df4ab3a` | 3,800.00 | **5,200.00** | +1,400.00 | Differentiate Shemiz catalog tier |
| Tailored Gold Shemiz | `TLT-SHE-AF3B7C` | `4a75af2d-6208-4125-b1b3-8c02dc3e6e5a` | 3,800.00 | **5,200.00** | +1,400.00 | Differentiate Shemiz catalog tier |
| Tailored Gold 3 | `TLT-SHE-4440A9` | `90d8a15d-f5b9-4111-a3b3-b69f59141a38` | 3,800.00 | **5,400.00** | +1,600.00 | Differentiate Shemiz catalog tier |
| Tailored Gold Shemiz And Suri | `TLT-SHE-186205` | `5b3583ec-147a-4eaf-b2cb-373fc2df3617` | 3,800.00 | **6,500.00** | +2,700.00 | Differentiate Shemiz catalog tier |


### Category: Suri (19 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Classic Suri Wear #1 | `TLT-SUR-753B3F` | `bf88d100-b04b-4b76-a248-7c4f78ea0ca0` | 2,800.00 | **2,400.00** | -400.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #2 | `TLT-SUR-C51C96` | `317c7ce6-8ee4-448a-8334-63489b9f87e5` | 2,800.00 | **2,400.00** | -400.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #3 | `TLT-SUR-2E03C1` | `b4c2da6e-2050-447a-b746-04d5d11f6fa1` | 2,800.00 | **2,500.00** | -300.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #4 | `TLT-SUR-B31168` | `7460a1a2-eaab-4716-ab7d-6e1d57dfc327` | 2,800.00 | **2,500.00** | -300.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #5 | `TLT-SUR-1AE0A7` | `ac177a24-555d-4b33-88ff-4abe1da51a82` | 2,800.00 | **2,600.00** | -200.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #6 | `TLT-SUR-59944B` | `44eb1161-aad4-4a91-ab8e-6f144efb903c` | 2,800.00 | **2,700.00** | -100.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #7 | `TLT-SUR-92A0D4` | `f7d258b7-fdc0-47b2-8c49-3515d48eeec4` | 2,800.00 | **2,800.00** | 0.00 (Baseline) | Differentiate Suri catalog tier |
| Classic Suri Wear #8 | `TLT-SUR-D224D6` | `96dac4ef-ffb0-4c38-bf31-597e685323ee` | 2,800.00 | **2,800.00** | 0.00 (Baseline) | Differentiate Suri catalog tier |
| Classic Suri Wear #10 | `TLT-SUR-DD5F0F` | `ddbcb829-43f9-4556-826c-1b675f10e4c7` | 2,800.00 | **2,900.00** | +100.00 | Differentiate Suri catalog tier |
| Classic Suri Wear #9 | `TLT-SUR-025804` | `73d24d96-a4f2-448a-b64a-39a4ab72658d` | 2,800.00 | **2,900.00** | +100.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #1 | `TLT-SUR-77F019` | `99d5cc0a-1104-4610-b3bd-9368db7f7750` | 2,800.00 | **3,000.00** | +200.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #2 | `TLT-SUR-06B585` | `dd58cb4b-181e-41e4-8471-d794532247f1` | 2,800.00 | **3,000.00** | +200.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #3 | `TLT-SUR-8F9956` | `9523c470-d08f-453e-81c0-ffe217ff7663` | 2,800.00 | **3,100.00** | +300.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #4 | `TLT-SUR-A41EB2` | `dc5797f1-8f82-43a1-970a-71dd63981727` | 2,800.00 | **3,100.00** | +300.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #5 | `TLT-SUR-571700` | `aee5d500-573d-4e82-ac6e-28a8e5b55f30` | 2,800.00 | **3,200.00** | +400.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #6 | `TLT-SUR-9AF4B3` | `d722a16b-f23b-4ce4-ae42-d936f086a4c9` | 2,800.00 | **3,200.00** | +400.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #7 | `TLT-SUR-EE6589` | `6537843a-ed7d-496b-b488-b646f3035e73` | 2,800.00 | **3,400.00** | +600.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #8 | `TLT-SUR-DE85A9` | `02bb20d3-9a13-4191-aeda-314d15bdcf80` | 2,800.00 | **3,400.00** | +600.00 | Differentiate Suri catalog tier |
| Artisanal Suri Trousers #9 | `TLT-SUR-CCDA07` | `9189a1a4-28f9-4bf0-b19f-9e11875351b9` | 2,800.00 | **3,500.00** | +700.00 | Differentiate Suri catalog tier |


### Category: Tigray (9 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Traditional Tigray Zuria Dress #1 | `TLT-TIG-BCBF25` | `81cac6a8-954a-4ce8-b1a1-304126a542e4` | 4,200.00 | **3,600.00** | -600.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #2 | `TLT-TIG-8587A7` | `28a3b3fa-9e4d-4018-847b-239e719dbf4c` | 4,200.00 | **3,800.00** | -400.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #3 | `TLT-TIG-458829` | `8fa0aaec-6af3-4e7c-b603-fedefe52944a` | 4,200.00 | **3,900.00** | -300.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #4 | `TLT-TIG-2F46AF` | `acb62e66-1e59-4f45-9bcf-2d6b23a41c98` | 4,200.00 | **4,200.00** | 0.00 (Baseline) | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #5 | `TLT-TIG-39B374` | `c7a8c5ec-c09d-41fa-802f-8fb147556426` | 4,200.00 | **4,200.00** | 0.00 (Baseline) | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #6 | `TLT-TIG-9A0276` | `f4712f0f-45c3-42b3-9d4e-ff28bbc419a3` | 4,200.00 | **4,500.00** | +300.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #7 | `TLT-TIG-161BFB` | `1a302076-5515-4d3f-ac31-cc5cf9e314d4` | 4,200.00 | **4,800.00** | +600.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #8 | `TLT-TIG-7CC57B` | `eb2ac26e-d56f-4447-9b30-c0fe7d9b6fc5` | 4,200.00 | **5,100.00** | +900.00 | Differentiate Tigray catalog tier |
| Traditional Tigray Zuria Dress #9 | `TLT-TIG-60F8E0` | `077a47fa-b0d7-456e-8b42-23a0b008ebfd` | 4,200.00 | **5,400.00** | +1,200.00 | Differentiate Tigray catalog tier |


### Category: Wedding (12 Items)

| Product Name | SKU | Variant ID | Current Price (ETB) | Proposed Price (ETB) | Adjustment | Rationalization Tier |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Royal Habesha Wedding Attire #1 | `TLT-WED-DDB28A` | `fbbce39d-c60f-4246-a89e-ac23bdd89d21` | 12,000.00 | **9,500.00** | -2,500.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #2 | `TLT-WED-FC0C9F` | `9c62b7ce-5f9a-4260-ae19-21e6085ac719` | 12,000.00 | **10,000.00** | -2,000.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #3 | `TLT-WED-0E65EF` | `5c26fcdd-3def-426b-92af-28c965ae0736` | 12,000.00 | **10,800.00** | -1,200.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #4 | `TLT-WED-8ED32B` | `bde18a3d-972a-4d70-b641-cd010df0fa30` | 12,000.00 | **11,500.00** | -500.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #5 | `TLT-WED-A3FA20` | `554ca01e-a7a6-45df-aa54-abeed7e989ce` | 12,000.00 | **12,000.00** | 0.00 (Baseline) | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #6 | `TLT-WED-DFD2B5` | `e1915130-768d-452d-a6d1-144d53acd996` | 12,000.00 | **12,500.00** | +500.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #7 | `TLT-WED-601E2C` | `abc44e95-260c-44c2-a881-0f5696788398` | 12,000.00 | **13,000.00** | +1,000.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #8 | `TLT-WED-DA282B` | `847525d1-a9f0-4322-92b1-81d41e95bcf4` | 12,000.00 | **13,800.00** | +1,800.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #9 | `TLT-WED-525179` | `d1e055b1-30dd-439f-a729-5b415a6d1324` | 12,000.00 | **15,000.00** | +3,000.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #10 | `TLT-WED-1C2221` | `0e3fcd06-82e6-46ea-a1fe-63935a0a81cb` | 12,000.00 | **16,200.00** | +4,200.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #11 | `TLT-WED-9A2EFB` | `d9580f31-28f1-47f1-b322-d386a9c52ec5` | 12,000.00 | **17,500.00** | +5,500.00 | Differentiate Wedding catalog tier |
| Royal Habesha Wedding Attire #12 | `TLT-WED-80B1E9` | `e0b82444-404c-4458-a076-a2b4454c5e5f` | 12,000.00 | **18,500.00** | +6,500.00 | Differentiate Wedding catalog tier |


## Unchanged Products (Preserved Legitimate Pricing)

A total of **20 products** are left completely unchanged:

| Product Name | SKU | Current Price (ETB) | Reason |
| :--- | :--- | :---: | :--- |
| Short Contemporary Habesha Kemis | `KMS-40-BESPOKE` | **22,000.00** | Preserve existing legitimate luxury pricing |
| Rose Pink Festive Kemis | `KMS-29-BESPOKE` | **23,000.00** | Preserve existing legitimate luxury pricing |
| Crimson Blush Habesha Kemis | `KMS-27-BESPOKE` | **23,500.00** | Preserve existing legitimate luxury pricing |
| Green Raya Ceremonial Kemis | `KMS-26-BESPOKE` | **24,000.00** | Preserve existing legitimate luxury pricing |
| Crimson White Habesha Kemis | `KMS-31-BESPOKE` | **24,500.00** | Preserve existing legitimate luxury pricing |
| Emerald Green Habesha Kemis | `KMS-25-BESPOKE` | **24,500.00** | Preserve existing legitimate luxury pricing |
| Azure Blue Habesha Kemis | `KMS-21-BESPOKE` | **25,000.00** | Preserve existing legitimate luxury pricing |
| Selam Grace Habesha Kemis | `KMS-33-BESPOKE` | **25,500.00** | Preserve existing legitimate luxury pricing |
| Enkutatash Celebration Kemis | `KMS-38-BESPOKE` | **26,000.00** | Preserve existing legitimate luxury pricing |
| Ruby Scarlet Habesha Kemis | `KMS-30-BESPOKE` | **26,000.00** | Preserve existing legitimate luxury pricing |
| Selam Raya Fusion Kemis | `KMS-34-BESPOKE` | **26,000.00** | Preserve existing legitimate luxury pricing |
| Midnight Dark Habesha Kemis | `KMS-23-BESPOKE` | **26,500.00** | Preserve existing legitimate luxury pricing |
| Dardar Royal Habesha Kemis | `KMS-37-BESPOKE` | **27,000.00** | Preserve existing legitimate luxury pricing |
| Golden Adey Abeba Kemis | `KMS-36-BESPOKE` | **27,000.00** | Preserve existing legitimate luxury pricing |
| Royal Reyal Heritage Kemis | `KMS-32-BESPOKE` | **27,000.00** | Preserve existing legitimate luxury pricing |
| Buna Coffee Ceremonial Kemis | `KMS-22-BESPOKE` | **27,500.00** | Preserve existing legitimate luxury pricing |
| Pure Albaso White Kemis | `KMS-35-BESPOKE` | **28,000.00** | Preserve existing legitimate luxury pricing |
| Lidiana Modern Habesha Kemis | `KMS-39-BESPOKE` | **28,500.00** | Preserve existing legitimate luxury pricing |
| Fenan Royal Gold Kemis | `KMS-24-BESPOKE` | **29,000.00** | Preserve existing legitimate luxury pricing |
| Nayo Heritage Couture Kemis | `KMS-28-BESPOKE` | **31,000.00** | Preserve existing legitimate luxury pricing |

---

## Implementation & Rollback Procedure

1. **Snapshot**: Current baseline prices were exported to `scratch/catalog_inventory_backup.json` with exact variant IDs, SKUs, and prices prior to writes.
2. **Transaction**: Application of prices was executed inside an atomic transaction (`transaction.atomic()`).
3. **Row Count Verification**: Explicit update of exactly 207 records was verified.
4. **Post-Update Verification**: Re-read all 227 variants from the database; confirmed 0 modifications to `OrderItem`, `Order`, `Payment`, `Product` metadata, stock, or reserved stock.

---

## Final Execution & Verification Sign-Off (October 25, 2026)

- **Total Inspected**: 227 Products, 227 ProductVariants across 14 categories.
- **Total Modified**: 207 ProductVariants updated atomically via `ProductVariant.objects.filter(id=v_id).update(price=...)`.
- **Total Preserved**: 20 Luxury Bespoke Kemis items (`KMS-*-BESPOKE`, 22,000.00 – 31,000.00 ETB) retained unchanged.
- **Historical Orders**: 2 Orders and 5 OrderItems snapshot checked before and after; 0 price or subtotal modifications.
- **Stock & Inventory**: Physical stock and reserved stock 100% untouched across all 227 variants.
- **Embedding Status**: Confirmed that `ProductEmbedding` text excludes price; search and AI tool fetch prices dynamically at runtime via `ProductVariant.price`. Vector embeddings remain fully valid.
- **Automated Tests**: `apps/products/tests.py` ran via `pytest` and passed (2 passed in 3.51s).
- **Execution Status**: COMPLETE & VERIFIED.