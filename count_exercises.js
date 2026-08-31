import models from './backend/models/index.js';
async function count() {
    const { ExerciseList } = models;
    const count = await ExerciseList.count();
    console.log('Total exercises:', count);
    process.exit(0);
}
count();
