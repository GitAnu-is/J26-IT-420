from typing import Dict, List, Optional

PACKAGING_RULES: List[Dict[str, object]] = [
    {
        "ruleId": "C4_PKG_BANANA_SHORT_TRANSIT",
        "cropType": "BANANA",
        "maxDistanceKm": 80,
        "recommendedPackaging": "Ventilated rigid plastic crates (600mm x 400mm x 300mm) with 10mm foam/corrugated paper interleaves.",
        "storageGuidance": [
            "Maintain transit ambient temperature between 13°C and 15°C; relative humidity 85-90%.",
            "Store in shade prior to loading; never hold banana bunches in direct sunlight as pulp temperature rises rapidly.",
            "Never expose bananas to temperatures below 12°C to prevent irreversible chilling injury (vascular browning).",
        ],
        "handlingGuidance": [
            "Dehand bunches into clusters of 4-8 fingers using sanitized curved dehanding knives.",
            "Pack hands crown-down or crown-inwards with cushioned interleaves between layers.",
            "Stack crates no higher than 4 layers to avoid compression injury on lower crates.",
            "Do not allow workers to sit on stacked produce crates.",
        ],
        "transportationGuidance": [
            "Use covered trucks or shaded pickups equipped with side ventilation slats.",
            "Secure crates with cross-strapping to eliminate lateral cargo shifting and vibration scuffing.",
            "Limit transit over unpaved/rough secondary roads to less than 25 km/h to minimize impact bruising.",
        ],
        "supportingReferences": [
            "Department of Agriculture Sri Lanka — Post-Harvest Management of Banana (Bulletin PH-04), Gannoruwa.",
            "FAO — Prevention of Post-Harvest Losses in Fruits and Vegetables (Training Series No. 17).",
        ],
        "ruleVersion": "v1.0",
        "reviewStatus": "AGRONOMIC_STANDARD_GUIDELINE",
    },
    {
        "ruleId": "C4_PKG_BANANA_LONG_TRANSIT",
        "cropType": "BANANA",
        "minDistanceKm": 80,
        "recommendedPackaging": "Heavy-duty telescoping corrugated fiberboard boxes (CFB) with ventilated kraft paper liners and ethylene-scavenging sachets.",
        "storageGuidance": [
            "Transport under active refrigeration at 13.5°C (±0.5°C) with 90-95% relative humidity.",
            "Pre-cool fruit to 14°C before long-distance loading to remove field heat.",
            "Isolate bananas from ethylene-producing ripening chambers or mature passion fruit/papaya.",
        ],
        "handlingGuidance": [
            "Wash cut crowns in clean alum/citric water bath to coagulate latex flow and prevent crown rot (Colletotrichum musae).",
            "Pack bananas in uniform 13.5 kg or 18 kg export-standard telescopic cartons.",
            "Ensure box ventilation holes (minimum 4-5% of total surface area) align precisely when stacked on pallets.",
        ],
        "transportationGuidance": [
            "Transport exclusively in insulated covered or refrigerated vehicles for transit exceeding 4 hours.",
            "Palletize boxes on 1200mm x 1000mm standard wooden or plastic pallets, shrink-wrapped with breathable corner boards.",
            "Avoid multi-stop transit routes where truck cargo bay is repeatedly opened in tropical heat.",
        ],
        "supportingReferences": [
            "Department of Agriculture Sri Lanka — Horticultural Division Advisory on Long-Distance Banana Transit, Peradeniya.",
            "Kader, A.A. — Postharvest Technology of Horticultural Crops (University of California Agriculture, Publication 3311).",
        ],
        "ruleVersion": "v1.0",
        "reviewStatus": "AGRONOMIC_STANDARD_GUIDELINE",
    },
    {
        "ruleId": "C4_PKG_PINEAPPLE_CRATES",
        "cropType": "PINEAPPLE",
        "maxDistanceKm": 100,
        "recommendedPackaging": "Single-layer or double-layer partitioned returnable plastic crates (RPC) with soft bottom padding.",
        "storageGuidance": [
            "Maintain transit temperature at 8°C - 10°C for partially ripe fruit (1-2 eyes yellow) or 10°C - 12°C for mature green fruit.",
            "Relative humidity must be maintained at 85-90% to prevent fruit crown and shell desiccation.",
            "Avoid temperatures below 7°C which induce internal browning / black heart physiological disorder.",
        ],
        "handlingGuidance": [
            "Trim peduncle (stalk) cleanly to 1.5 - 2 cm length with sanitized shears; never break or twist stalk manually.",
            "Pack pineapples vertically upright on their flat base or horizontally alternating crown-to-base.",
            "Ensure fruit crowns do not puncture neighboring fruit shells.",
            "Never stack loose pineapples in bulk heaps exceeding 2 layers.",
        ],
        "transportationGuidance": [
            "Use covered ventilated trucks equipped with shock-absorbing leaf-spring suspension.",
            "Avoid transporting pineapples in open three-wheelers or open trailers during mid-day sun (11 AM - 3 PM).",
            "Maintain smooth vehicle acceleration and braking to prevent fruit collisions inside crates.",
        ],
        "supportingReferences": [
            "Department of Agriculture Sri Lanka — Fruit Research & Development Institute (FRDI), Kananwila — Pineapple Post-Harvest Handover Protocol.",
            "FAO — Pineapple Post-Harvest Operations (INPhO Post-Harvest Compendium).",
        ],
        "ruleVersion": "v1.0",
        "reviewStatus": "AGRONOMIC_STANDARD_GUIDELINE",
    },
    {
        "ruleId": "C4_PKG_PINEAPPLE_LONG_TRANSIT",
        "cropType": "PINEAPPLE",
        "minDistanceKm": 100,
        "recommendedPackaging": "Cell-pack corrugated fiberboard master cartons with individual cell dividers (horizontal or vertical partitions).",
        "storageGuidance": [
            "Transport under refrigerated containerized conditions at 8.0°C (±1.0°C) with continuous forced-air circulation.",
            "Treat cut peduncle base with 2% calcium chloride or approved wax emulsion to block entry of Chalara paradoxa (black rot).",
            "Monitor container ethylene levels and ensure fresh air ventilation of 15 m³/hour per container.",
        ],
        "handlingGuidance": [
            "Sort pineapples by uniform grade and stage of maturity (0 to 25% yellow) before boxing.",
            "Individual fruits must rest securely in cardboard cells to eliminate skin abrasion during transit vibration.",
            "Max box weight should not exceed 12 kg (typically 6 to 10 fruits per carton depending on fruit count).",
        ],
        "transportationGuidance": [
            "Ensure pre-trip vehicle pre-cooling to 9°C prior to cargo loading.",
            "Palletize with interlocking cross-stacking and secure with plastic strapping and edge protectors.",
            "Schedule departures during night or early morning hours (6 PM - 6 AM) to reduce refrigeration thermal load.",
        ],
        "supportingReferences": [
            "Department of Agriculture Sri Lanka — Quality Standards & Packaging for Export Pineapple (Horana Station).",
            "Codex Alimentarius — Standard for Pineapples (CXS 182-1993, Amended 2011).",
        ],
        "ruleVersion": "v1.0",
        "reviewStatus": "AGRONOMIC_STANDARD_GUIDELINE",
    },
    {
        "ruleId": "C4_PKG_BLACK_PEPPER_DRY_TRANSIT",
        "cropType": "BLACK_PEPPER",
        "recommendedPackaging": "Multi-wall kraft paper sacks or food-grade high-density woven polypropylene (HDPE) bags with 50-micron polyethylene liner.",
        "storageGuidance": [
            "Verify moisture content is strictly BELOW 12.0% (wet basis) before bagging; never transport pepper above 12% moisture.",
            "Keep storage environment completely dry; relative humidity below 65% to avoid Aspergillus and mold formation.",
            "Maintain ambient storage temperatures (20°C - 30°C); avoid condensation caused by abrupt temperature shifts.",
        ],
        "handlingGuidance": [
            "Ensure bags are clean, odorless, and free from insect infestation, mold stains, and pesticide residues.",
            "Heat-seal or double-stitch the inner polyethylene liner; machine-sew the outer bag mouth securely.",
            "Use wooden pallet dunnage (at least 15 cm off vehicle floor) to prevent ground moisture absorption.",
            "Do not use metal hooks when lifting bags, as puncture tears allow moisture ingress.",
        ],
        "transportationGuidance": [
            "Transport exclusively in waterproof, completely dry, and swept-clean covered trucks or container vans.",
            "Cover bag stacks with heavy waterproof tarpaulin even inside covered vehicles during monsoon transits.",
            "Strictly isolate pepper shipments from volatile chemical odors, petroleum fuels, fertilizers, and wet produce.",
            "Inspect truck floorboards for protruding nails, splinters, or chemical residue before loading.",
        ],
        "supportingReferences": [
            "Department of Export Agriculture (DEA) Sri Lanka — Quality Assurance & Post-Harvest Processing of Black Pepper, Matale.",
            "International Pepper Community (IPC) — Good Agricultural and Processing Practices for Black Pepper.",
        ],
        "ruleVersion": "v1.0",
        "reviewStatus": "AGRONOMIC_STANDARD_GUIDELINE",
    },
]


def generate_packaging_recommendations(
    crop_type: str,
    distance_km: float,
    vehicle_type: Optional[str] = None,
    expected_duration_hours: Optional[float] = None,
    current_packaging_type: Optional[str] = None,
    temperature_celsius: Optional[float] = None,
    humidity_percentage: Optional[float] = None,
) -> Dict[str, object]:
    normalized_crop = crop_type.upper().strip()
    matched_rules = [r for r in PACKAGING_RULES if r["cropType"] == normalized_crop]

    if not matched_rules:
        return {
            "cropType": normalized_crop,
            "recommendedPackaging": "Standard ventilated plastic crates with protective cushioning.",
            "storageGuidance": ["Maintain dry, shaded conditions and avoid direct sunlight."],
            "handlingGuidance": ["Handle produce with care to avoid mechanical bruising."],
            "transportationGuidance": ["Transport in covered, clean vehicles on paved roads where possible."],
            "supportingReferences": ["Department of Agriculture Sri Lanka — General Post-Harvest Guidelines."],
            "ruleId": "C4_PKG_GENERIC",
            "ruleVersion": "v1.0",
            "reviewStatus": "FALLBACK_GENERAL_ADVISORY",
        }

    selected_rule = matched_rules[0]
    for r in matched_rules:
        if "minDistanceKm" in r and distance_km >= r["minDistanceKm"]:
            selected_rule = r
            break
        elif "maxDistanceKm" in r and distance_km <= r["maxDistanceKm"]:
            selected_rule = r
            break

    contextual_warnings: List[str] = []

    if current_packaging_type:
        norm_pkg = current_packaging_type.upper()
        if normalized_crop == "BANANA" and norm_pkg in ["GUNNY_BAGS", "JUTE_BAGS", "LOOSE_BULK"]:
            contextual_warnings.append(
                f"HIGH RISK PACKAGING: '{current_packaging_type}' provides zero compressive and shock protection for tender banana skins. "
                "Severe finger abrasion and bunch crushing will occur. Upgrade to rigid plastic crates immediately."
            )
        elif normalized_crop == "PINEAPPLE" and norm_pkg in ["GUNNY_BAGS", "LOOSE_BULK"]:
            contextual_warnings.append(
                f"UNSUITABLE PACKAGING: Packing pineapples in '{current_packaging_type}' results in spine puncturing and pressure bruises. "
                "Use compartmentalized cartons or rigid plastic crates."
            )
        elif normalized_crop == "BLACK_PEPPER" and norm_pkg in ["LOOSE_BULK", "WOODEN_CRATES"]:
            contextual_warnings.append(
                f"MOISTURE RISK: '{current_packaging_type}' exposes dry black pepper to ambient humidity and external contaminants. "
                "Use double-sealed HDPE woven bags with food-grade polyethylene liners."
            )

    return {
        "cropType": normalized_crop,
        "ruleId": selected_rule["ruleId"],
        "recommendedPackaging": selected_rule["recommendedPackaging"],
        "storageGuidance": selected_rule["storageGuidance"],
        "handlingGuidance": selected_rule["handlingGuidance"],
        "transportationGuidance": selected_rule["transportationGuidance"],
        "contextualWarnings": contextual_warnings,
        "supportingReferences": selected_rule["supportingReferences"],
        "ruleVersion": selected_rule["ruleVersion"],
        "reviewStatus": selected_rule["reviewStatus"],
    }
