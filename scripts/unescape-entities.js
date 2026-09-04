/*
 * migration for the `.escape()` removal.
 */
require('dotenv/config');
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');

const URI = process.env.MONGODB_URI;
if (!URI) {
    console.error(
        [
            'MONGODB_URI is not set.',
            '',
            'This repo has no .env committed, so either pass it inline:',
            "  MONGODB_URI='mongodb+srv://...' node scripts/unescape-entities.js",
            '',
            'or create a .env file in the repo root containing:',
            '  MONGODB_URI=mongodb+srv://...',
            '',
            'Use the same connection string your deployed backend uses.',
        ].join('\n'),
    );
    process.exit(1);
}

const unescape = (v) =>
    typeof v === 'string'
        ? v
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#x2F;/g, '/')
              .replace(/&#x5C;/g, '\\')
              .replace(/&#96;/g, '`')
              .replace(/&amp;/g, '&')
        : v;

const TARGETS = [
    ['users', ['username', 'bio']],
    ['movies', ['title', 'synopsis', 'poster', 'director', 'country', 'language', 'run_time']],
    ['reviews', ['content']],
    ['comments', ['content']],
];

(async () => {
    await mongoose.connect(URI);
    const db = mongoose.connection.db;
    let touched = 0;

    for (const [name, fields] of TARGETS) {
        const collection = db.collection(name);
        for await (const doc of collection.find({})) {
            const update = {};
            for (const field of fields) {
                const next = unescape(doc[field]);
                if (next !== doc[field]) update[field] = next;
            }
            if (!Object.keys(update).length) continue;

            touched++;
            for (const [field, next] of Object.entries(update)) {
                console.log(`${name}/${doc._id} ${field}`);
                console.log(`  - ${JSON.stringify(doc[field])}`);
                console.log(`  + ${JSON.stringify(next)}`);
            }
            if (APPLY) await collection.updateOne({ _id: doc._id }, { $set: update });
        }
    }

    console.log(
        `\n${touched} document(s) ${APPLY ? 'updated' : 'would change'}.` +
            (APPLY ? '' : ' Re-run with --apply to write.'),
    );
    await mongoose.disconnect();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
