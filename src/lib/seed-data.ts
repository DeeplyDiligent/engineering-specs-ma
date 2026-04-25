import { dbService } from './db-service';

const SEED_DATA_LOADED_KEY = 'seed_data_loaded';

export async function initializeSeedData() {
  const alreadyLoaded = localStorage.getItem(SEED_DATA_LOADED_KEY);
  
  if (alreadyLoaded === 'true') {
    return;
  }

  try {
    const schemas = {
      "engineering_projects": {
        "id": "engineering_projects",
        "name": "Engineering Projects",
        "pages": [
          {
            "blocks": [
              {"id": "site_drawing", "label": "Site Drawing Upload", "order": 0, "type": "file"},
              {"id": "site_description", "label": "Site Description", "order": 1, "type": "markdown"},
              {"id": "approved", "label": "Site Plan Approved", "order": 2, "type": "checkbox"}
            ],
            "id": "site_plan",
            "name": "Site Plan"
          },
          {
            "blocks": [
              {"id": "structural_drawing", "label": "Structural Drawing", "order": 0, "type": "file"},
              {"id": "material_list", "label": "Material List", "order": 1, "type": "markdown"},
              {"id": "load_calculations", "label": "Load Calculations", "order": 2, "type": "markdown"},
              {"id": "engineer_approved", "label": "Engineer Approved", "order": 3, "type": "checkbox"}
            ],
            "id": "structural_specs",
            "name": "Structural Specifications"
          },
          {
            "blocks": [
              {"id": "wiring_diagram", "label": "Wiring Diagram", "order": 0, "type": "file"},
              {"id": "electrical_notes", "label": "Electrical Notes", "order": 1, "type": "markdown"},
              {"id": "safety_checked", "label": "Safety Requirements Met", "order": 2, "type": "checkbox"}
            ],
            "id": "electrical_specs",
            "name": "Electrical Specifications"
          }
        ]
      },
      "manufacturing": {
        "id": "manufacturing",
        "name": "Manufacturing",
        "pages": [
          {
            "blocks": [
              {"id": "production_schedule", "label": "Production Schedule", "order": 0, "type": "markdown"},
              {"id": "resource_allocation", "label": "Resource Allocation", "order": 1, "type": "markdown"},
              {"id": "schedule_approved", "label": "Schedule Approved", "order": 2, "type": "checkbox"}
            ],
            "id": "production_plan",
            "name": "Production Plan"
          },
          {
            "blocks": [
              {"id": "qc_checklist", "label": "QC Checklist Document", "order": 0, "type": "file"},
              {"id": "inspection_notes", "label": "Inspection Notes", "order": 1, "type": "markdown"},
              {"id": "qc_passed", "label": "QC Passed", "order": 2, "type": "checkbox"}
            ],
            "id": "quality_control",
            "name": "Quality Control"
          }
        ]
      }
    };

    const jobs = {
      "JOB-2024-001": {"categoryId": "engineering_projects", "createdAt": 1704067200000, "id": "JOB-2024-001"},
      "JOB-2024-002": {"categoryId": "engineering_projects", "createdAt": 1704153600000, "id": "JOB-2024-002"},
      "MFG-2024-001": {"categoryId": "manufacturing", "createdAt": 1704240000000, "id": "MFG-2024-001"}
    };

    const pages = {
      "JOB-2024-001": {
        "1": {
          "categoryId": "engineering_projects",
          "jobId": "JOB-2024-001",
          "pageNumber": "1",
          "values": {
            "approved": true,
            "site_description": "Commercial building site located at 123 Main Street. Lot size: 5000 sq ft. Zoning: Commercial-1. The site is currently vacant with good access from Main Street. Utilities are available at the street edge.\n\nKey Features:\n- Flat terrain\n- Good drainage\n- Close to major transportation routes\n- Ample parking space available",
            "site_drawing": ""
          }
        },
        "2": {
          "categoryId": "engineering_projects",
          "jobId": "JOB-2024-001",
          "pageNumber": "2",
          "values": {
            "engineer_approved": false,
            "load_calculations": "Dead Load: 85 PSF\nLive Load: 100 PSF\nWind Load: 120 mph (per ASCE 7-16)\nSeismic Design Category: C\n\nTotal factored load: 1.2D + 1.6L = 262 PSF",
            "material_list": "## Primary Materials\n\n- Concrete: 200 cubic yards (4000 PSI)\n- Steel Beams: W12x50 (qty: 24)\n- Rebar: #5 Grade 60 (15 tons)\n- Structural Steel Columns: HSS 12x12x1/2 (qty: 16)\n\n## Secondary Materials\n\n- Metal Decking: 22 gauge (5000 sq ft)\n- Anchor Bolts: 1\" diameter (qty: 128)\n- Welding consumables as per AWS D1.1",
            "structural_drawing": ""
          }
        }
      },
      "JOB-2024-002": {
        "1": {
          "categoryId": "engineering_projects",
          "jobId": "JOB-2024-002",
          "pageNumber": "1",
          "values": {
            "approved": false,
            "site_description": "Residential development site - Phase 2. Location: Sunset Hills subdivision. Total area: 12 acres.\n\nTopography: Rolling hills with 15-20ft elevation change\nSoil Type: Clay with good bearing capacity (3000 PSF)\nAccess: Two points from Sunset Boulevard",
            "site_drawing": ""
          }
        }
      },
      "MFG-2024-001": {
        "1": {
          "categoryId": "manufacturing",
          "jobId": "MFG-2024-001",
          "pageNumber": "1",
          "values": {
            "production_schedule": "## Week 1-2: Setup and Preparation\n- Machine calibration\n- Material procurement\n- Team training\n\n## Week 3-6: Production Phase 1\n- Batch A: 500 units\n- Batch B: 750 units\n- Quality checks at each milestone\n\n## Week 7-8: Final Assembly\n- Integration and testing\n- Packaging preparation",
            "resource_allocation": "Production Line 1: 8 operators\nProduction Line 2: 6 operators\nQuality Control: 3 inspectors\nMaterials Handler: 2 staff\n\nMachinery:\n- CNC Mill #3, #5\n- Assembly Station A, B, C\n- Testing Bay #2",
            "schedule_approved": true
          }
        },
        "2": {
          "categoryId": "manufacturing",
          "jobId": "MFG-2024-001",
          "pageNumber": "2",
          "values": {
            "inspection_notes": "Initial inspection completed on first batch:\n\n✓ Dimensional accuracy within ±0.001\"\n✓ Surface finish meets Ra 32 specification\n✓ All fasteners torqued to spec\n⚠ Minor cosmetic issue on 3 units - rework scheduled\n✓ Functionality tests passed 100%\n\nRecommendation: Proceed to full production",
            "qc_checklist": "",
            "qc_passed": true
          }
        }
      }
    };

    for (const [schemaId, schemaData] of Object.entries(schemas)) {
      await dbService.saveSchema(schemaId, schemaData as any);
    }

    for (const [jobId, jobData] of Object.entries(jobs)) {
      await dbService.saveJob(jobId, jobData as any);
    }

    for (const [jobId, jobPages] of Object.entries(pages)) {
      for (const [pageNum, pageData] of Object.entries(jobPages)) {
        await dbService.savePageData(jobId, pageNum, pageData as any);
      }
    }

    localStorage.setItem(SEED_DATA_LOADED_KEY, 'true');
    console.log('Seed data loaded successfully');
  } catch (error) {
    console.error('Failed to load seed data:', error);
  }
}
