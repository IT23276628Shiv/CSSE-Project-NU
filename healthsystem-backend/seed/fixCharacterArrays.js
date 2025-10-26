// healthsystem-backend/scripts/fixCharacterArrays.js
// Run this ONCE to fix existing corrupted data in MongoDB
// Usage: node scripts/fixCharacterArrays.js

import "dotenv/config";
import mongoose from "mongoose";
import { Patient } from "../src/models/index.js";

async function fixCharacterArrays() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "healthsystem" });
    console.log("✅ Connected to MongoDB");

    const patients = await Patient.find({});
    console.log(`Found ${patients.length} patients to check`);

    let fixedCount = 0;

    for (const patient of patients) {
      let needsUpdate = false;
      const updates = {};

      // Fix allergies
      if (patient.allergies && patient.allergies.length > 0) {
        const fixedAllergies = patient.allergies.map(a => {
          if (typeof a === 'string') return { allergen: a };
          
          // Check if it's a character array (has numeric keys)
          if (a && typeof a === 'object' && a.hasOwnProperty('0')) {
            const chars = Object.keys(a)
              .filter(key => !isNaN(key) && key !== '_id')
              .sort((a, b) => Number(a) - Number(b))
              .map(key => a[key]);
            const allergen = chars.join('');
            
            console.log(`  Fixed allergy: ${allergen}`);
            needsUpdate = true;
            return { allergen };
          }
          
          return a;
        });
        
        if (needsUpdate) {
          updates.allergies = fixedAllergies;
        }
      }

      // Fix chronic conditions
      if (patient.chronicConditions && patient.chronicConditions.length > 0) {
        const fixedConditions = patient.chronicConditions.map(c => {
          if (typeof c === 'string') return { condition: c };
          
          if (c && typeof c === 'object' && c.hasOwnProperty('0')) {
            const chars = Object.keys(c)
              .filter(key => !isNaN(key) && key !== '_id')
              .sort((a, b) => Number(a) - Number(b))
              .map(key => c[key]);
            const condition = chars.join('');
            
            console.log(`  Fixed condition: ${condition}`);
            needsUpdate = true;
            return { condition };
          }
          
          return c;
        });
        
        if (needsUpdate) {
          updates.chronicConditions = fixedConditions;
        }
      }

      // Fix current medications
      if (patient.currentMedications && patient.currentMedications.length > 0) {
        const fixedMeds = patient.currentMedications.map(m => {
          if (typeof m === 'string') return { name: m };
          
          if (m && typeof m === 'object' && m.hasOwnProperty('0')) {
            const chars = Object.keys(m)
              .filter(key => !isNaN(key) && key !== '_id')
              .sort((a, b) => Number(a) - Number(b))
              .map(key => m[key]);
            const name = chars.join('');
            
            console.log(`  Fixed medication: ${name}`);
            needsUpdate = true;
            return { name };
          }
          
          return m;
        });
        
        if (needsUpdate) {
          updates.currentMedications = fixedMeds;
        }
      }

      // Update patient if needed
      if (needsUpdate && Object.keys(updates).length > 0) {
        console.log(`\n🔧 Fixing patient: ${patient.fullName} (${patient.healthCardId})`);
        await Patient.updateOne({ _id: patient._id }, { $set: updates });
        fixedCount++;
        console.log(`  ✅ Fixed ${Object.keys(updates).length} field(s)`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Total patients: ${patients.length}`);
    console.log(`   Fixed patients: ${fixedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

fixCharacterArrays();