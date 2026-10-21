"""
Validated Agricultural Management Guidance Registry
AgriGuard Research Project (J26-IT-420 - SLIIT)

Evidence-based disease management and mitigation guidance derived from official
publications of the Sri Lanka Department of Agriculture (DOA) and the
Department of Export Agriculture (DEA).
"""

from typing import Dict, List, Optional

GUIDANCE_REGISTRY: Dict[str, Dict[str, object]] = {
    "BANANA___HEALTHY": {
        "displayName": "Healthy Foliage",
        "crop": "BANANA",
        "guidance": [
            "Continue standard cultural management and regular field sanitation.",
            "Maintain balanced potassium nutrition (Muriate of Potash - MOP) to enhance bunch development and natural leaf cuticle resistance.",
            "Monitor lower leaves every 14 days during monsoon seasons for early Sigatoka flecks."
        ],
        "citation": "Department of Agriculture Sri Lanka - Horticultural Crop Research and Development Institute (HORDI), Gannoruwa. Technical Advisory Series: Banana Cultivation & Disease Surveillance.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "BANANA___SIGATOKA": {
        "displayName": "Sigatoka Leaf Spot (Pseudocercospora spp.)",
        "crop": "BANANA",
        "guidance": [
            "Deleaf and prune necrotic leaves displaying active sporulating lesions; safely burn or bury debris outside the plantation to destroy ascospore inoculum.",
            "Improve field drainage and widen sucker spacing to increase aeration and lower relative humidity beneath the canopy.",
            "Avoid overhead sprinkler irrigation that deposits water droplets on lamina and facilitates conidial germination.",
            "Where infection exceeds 5% of functional leaf area, apply approved protective fungicide (Mancozeb or mineral oil emulsion) following DOA Peradeniya recommendations.",
            "Rotate chemical fungicide classes with systemic sterol inhibitors (e.g. Propiconazole) to prevent fungicide resistance."
        ],
        "citation": "Department of Agriculture Sri Lanka - Circular on Black & Yellow Sigatoka Management (Pseudocercospora fijiensis/musae), Peradeniya.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "BANANA___BUNCHY_TOP": {
        "displayName": "Banana Bunchy Top Virus (BBTV)",
        "crop": "BANANA",
        "guidance": [
            "CRITICAL: Uproot and completely destroy (rogue) infected banana mats including the corm and attached suckers immediately.",
            "Inject systemic insecticide or kerosene into the pseudostem before digging to eradicate the vector aphid (Pentalonia nigronervosa) and prevent dispersal.",
            "Monitor neighboring healthy mats for characteristic dark green 'dot-dash' streaks along secondary leaf veins.",
            "Plant only certified, virus-indexed tissue-culture plantlets for replanting; never exchange vegetative suckers from affected plantations.",
            "Notify the local Agricultural Research & Production Assistant (ARPA) or Agrarian Services Centre for regional containment."
        ],
        "citation": "Department of Agriculture Sri Lanka - Extension Bulletin: Banana Bunchy Top Virus (BBTV) Eradication Protocol, Gannoruwa.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "PINEAPPLE___HEALTHY": {
        "displayName": "Healthy Foliage",
        "crop": "PINEAPPLE",
        "guidance": [
            "Maintain raised beds (ridge planting) of 20-30 cm height to guarantee rapid surface and subsurface drainage.",
            "Apply split applications of nitrogen and potassium based on local soil test recommendations.",
            "Regularly inspect the heart and central whorl of young plants, especially after torrential monsoon rainfall."
        ],
        "citation": "Department of Agriculture Sri Lanka - Fruit Research and Development Institute (FRDI), Kananwila. Pineapple Production Guide.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "PINEAPPLE___HEART_ROT": {
        "displayName": "Heart Rot / Top Rot (Phytophthora nicotianae)",
        "crop": "PINEAPPLE",
        "guidance": [
            "Construct deep drainage channels between ridges to prevent waterlogging around root and collar zones.",
            "Carefully rogue and burn rotting plants; drench planting hole and adjacent basins with copper oxychloride (0.25%).",
            "Dip planting suckers/slips in an approved systemic fungicide suspension (e.g. Fosetyl-Al or Metalaxyl) for 10 minutes prior to field establishment.",
            "Avoid planting during peak monsoon periods on heavy, clay-rich soils.",
            "Prevent soil from splashing or falling into the central heart whorl during weeding and fertilizer application."
        ],
        "citation": "Department of Agriculture Sri Lanka - Advisory Leaflet: Management of Heart Rot & Root Rot in Pineapple (Phytophthora nicotianae), Horana.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "BLACK_PEPPER___HEALTHY": {
        "displayName": "Healthy Foliage & Spikes",
        "crop": "BLACK_PEPPER",
        "guidance": [
            "Regulate shade on live support trees (Gliricidia sepium) twice annually to ensure approximately 50% solar radiation penetration.",
            "Mulch vine basins with dry weed slash or coconut coir dust to conserve soil moisture and suppress soil-borne pathogens.",
            "Apply dolomite annually (500g/vine) to maintain soil pH between 5.5 and 6.5 as recommended by the DEA."
        ],
        "citation": "Department of Export Agriculture (DEA) Sri Lanka - Research Station, Matale. Good Agricultural Practices (GAP) for Black Pepper Cultivation.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "BLACK_PEPPER___QUICK_WILT": {
        "displayName": "Quick Wilt / Foot Rot (Phytophthora capsici)",
        "crop": "BLACK_PEPPER",
        "guidance": [
            "Provide drainage trenches around vine bases before the onset of monsoon rains to prevent collar immersion.",
            "Paint vine collar from soil level up to 50 cm with 1% Bordeaux mixture or Copper Hydroxide paste prior to monsoon onset.",
            "Drench root zones of neighboring healthy vines with 0.2% Potassium Phosphonate or Metalaxyl-Mancozeb.",
            "Uproot dead and severely wilted vines including primary root systems; burn on-site and lime the pit with 500g quicklime.",
            "Sterilize pruning knives and digging implements with 70% alcohol or bleach between handling individual vines."
        ],
        "citation": "Department of Export Agriculture (DEA) Sri Lanka - Technical Bulletin No. 12: Integrated Management of Quick Wilt / Foot Rot (Phytophthora capsici) in Black Pepper, Matale.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    },
    "BLACK_PEPPER___POLLU_DISEASE": {
        "displayName": "Pollu Disease / Anthracnose (Colletotrichum gloeosporioides)",
        "crop": "BLACK_PEPPER",
        "guidance": [
            "Prune excess branches on support trees before spike emergence to increase sunlight and reduce localized relative humidity.",
            "Spray 1% Bordeaux mixture or Carbendazim (0.1%) during initial spike emergence and repeat 30 days later during berry setting.",
            "Remove and destroy fallen infected spikes and diseased leaf litter beneath the vine canopy.",
            "Control the pepper flea beetle (Longitarsus nigripennis) whose feeding punctures predispose berries to fungal colonization.",
            "Avoid harvesting unripe spikes during wet overcast periods."
        ],
        "citation": "Department of Export Agriculture (DEA) Sri Lanka - Advisory Leaflet: Anthracnose and Pollu Disease (Colletotrichum gloeosporioides) Management in Black Pepper, Matale.",
        "lastReviewedDate": "2026-03-15",
        "version": "v1.0"
    }
}

def get_guidance_for_prediction(
    predicted_class: str,
    confidence: float,
    crop_type: Optional[str] = None
) -> Dict[str, object]:
    """
    Retrieve validated management guidance.
    If confidence < 0.65, prepends a cautionary uncertainty disclaimer.
    """
    entry = GUIDANCE_REGISTRY.get(predicted_class)
    if not entry:
        return {
            "displayName": predicted_class,
            "guidance": [
                "Disease class is unverified in official agronomic registry.",
                "Consult the nearest Department of Agriculture Agrarian Service Centre for visual examination."
            ],
            "citation": "Department of Agriculture Sri Lanka - General Plant Protection Advisory.",
            "lastReviewedDate": "2026-03-15",
            "version": "v1.0"
        }

    guidance_list = list(entry["guidance"])

    if confidence < 0.65:
        disclaimer = (
            f"UNCERTAINTY WARNING: Model confidence is low ({confidence * 100:.1f}%). "
            f"Visual symptoms are borderline or inconclusive. Do not apply chemical fungicides "
            f"without physical field inspection by an Agricultural Officer (DOA/DEA)."
        )
        guidance_list.insert(0, disclaimer)

    return {
        "displayName": entry["displayName"],
        "guidance": guidance_list,
        "citation": entry["citation"],
        "lastReviewedDate": entry["lastReviewedDate"],
        "version": entry["version"]
    }
