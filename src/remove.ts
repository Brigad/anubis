import fs from 'fs';
import yesno from 'yesno';

export const removeEncrypted = async (files: string[]) => {
    if (!files.length) {
        console.log(`Nothing to remove, skipping.`);
    } else {
        const ok = await yesno({
            question: `Are you sure you want to ${'remove'.red} these ${`${files.length}`.red} files?`
        });

        if (ok) {
            files.map(f =>fs.unlinkSync(f));

            console.log(`${`${files.length}`.red} files were removed.`)
        }
    }
};
