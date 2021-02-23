import fs from 'fs';

const startSymbol = '## <anubis> ##';
const endSymbol = '## </anubis> ##';

export const addToGitignore = (gitIgnorePath: string, paths: string[]) => {
    const newContent =  `${startSymbol}\n${paths.join('\n')}\n${endSymbol}\n`;

    let gitignore: string;

    if (fs.existsSync(gitIgnorePath)) {
        gitignore = fs.readFileSync(gitIgnorePath).toString();

        const startIndex = gitignore.indexOf(startSymbol);
        const endIndex = gitignore.indexOf(endSymbol);


        if (startIndex !== -1 && endIndex !== -1) {
            gitignore = gitignore.substring(0, startIndex) + newContent + gitignore.substring(endIndex + endSymbol.length + 1);
        } else {
            gitignore = gitignore + (gitignore.endsWith('\n\n') ? '' : '\n\n') + newContent;
        }
    } else {
        gitignore = newContent;
    }

    fs.writeFileSync(gitIgnorePath, gitignore)
}
