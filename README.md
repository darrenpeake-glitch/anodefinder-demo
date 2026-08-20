# AnodeFinder Demo

Proof-of-concept for an independent marine-anode retailer built around **compatibility search + supplier-direct fulfilment**, rather than a conventional catalogue-first chandlery.

## Sprint 0

- React + Vite static storefront
- GitHub Pages deployment workflow
- Search by Tecnoseal SKU, OEM reference, manufacturer/application and material
- Small verified demonstration catalogue using the supplied Tecnoseal UK trade list
- Indicative pricing engine: 40% target gross margin, 33% minimum policy floor
- Simulated basket and checkout / supplier-routing flow

## Data provenance

The demo dataset is intentionally small. Trade costs are taken from the supplied **Tecnoseal UK Trade Price List — September 2022**, including the workbook's **Engine Kits — Revised Dec 2024** sheet. Technical compatibility must be verified against current manufacturer data before commercial use.

## Deployment

GitHub Pages is deployed from GitHub Actions on pushes to `main`.

## Important

This is a demo only. It is not affiliated with or endorsed by Tecnoseal, Volvo Penta, Mercury/MerCruiser, Sleipner or any other referenced manufacturer. Third-party names and OEM references are used only as compatibility references.
