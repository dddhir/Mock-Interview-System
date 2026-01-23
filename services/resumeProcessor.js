const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

class ResumeProcessor {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        console.log('✅ Resume processor initialized');
    }

    async extractTextFromFile(file, mimetype) {
        try {
            let text = '';

            switch (mimetype) {
                case 'application/pdf':
                    const pdfData = await pdfParse(file);
                    text = pdfData.text;
                    break;

                case 'application/msword':
                case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    const docResult = await mammoth.extractRawText({ buffer: file });
                    text = docResult.value;
                    break;

                case 'text/plain':
                    text = file.toString('utf-8');
                    break;

                default:
                    throw new Error('Unsupported file type');
            }

            return text.trim();
        } catch (error) {
            console.error('Error extracting text from file:', error);
            throw new Error('Failed to extract text from resume');
        }
    }

    // Main extraction function - uses regex for reliability
    async extractAllFromResume(resumeText) {
        console.log('🔍 Parsing resume...');

        const projects = this.extractProjects(resumeText);
        const experience = this.extractExperience(resumeText);
        const skills = this.extractSkills(resumeText);

        console.log('✅ Extracted:');
        console.log(`   Projects: ${projects.length}`);
        projects.forEach((p, i) => console.log(`   - ${i + 1}. ${p.name}`));
        console.log(`   Experience: ${experience.length}`);
        experience.forEach((e, i) => console.log(`   - ${i + 1}. ${e.role} at ${e.company}`));
        console.log(`   Skills: ${skills.length}`);

        return { projects, experience, skills, education: [], summary: '' };
    }

    extractProjects(text) {
        const projects = [];

        // Find PROJECTS section
        const projectsMatch = text.match(/PROJECTS?\s*\n([\s\S]*?)(?=\n\s*(?:TECHNICAL SKILLS|SKILLS|EDUCATION|ACHIEVEMENTS|WORK EXPERIENCE|CERTIFICATIONS|$))/i);

        if (!projectsMatch) return projects;

        const projectsSection = projectsMatch[1];
        const lines = projectsSection.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let currentProject = null;
        let i = 0;

        console.log('\n🔍 ANALYZING PROJECTS SECTION:');
        console.log('Lines found:', lines.length);

        while (i < lines.length) {
            const line = lines[i];
            console.log(`\nLine ${i + 1}: "${line}"`);

            // Skip empty lines
            if (!line) {
                i++;
                continue;
            }

            // Check if this is a bullet point (description)
            const isBullet = line.match(/^[•\-\*]\s/) || line.match(/^\d+\.\s/) || line.startsWith('○') || line.startsWith('▪');

            if (isBullet) {
                console.log('   → BULLET POINT (description)');
                if (currentProject) {
                    const bulletText = line.replace(/^[•\-\*\d\.○▪]\s*/, '').trim();
                    currentProject.description += bulletText + '. '; // Add period and space
                }
                i++;
                continue;
            }

            // Check if line starts with action verbs (likely description, not title)
            const actionVerbs = [
                'developed', 'built', 'created', 'implemented', 'designed', 'tested', 'validated',
                'integrated', 'optimized', 'managed', 'led', 'worked', 'used', 'utilized',
                'achieved', 'reduced', 'increased', 'improved', 'wrote', 'maintained',
                'deployed', 'configured', 'analyzed', 'collaborated', 'contributed',
                'established', 'enhanced', 'streamlined', 'architected', 'engineered'
            ];

            const firstWord = line.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
            const startsWithVerb = actionVerbs.includes(firstWord);

            if (startsWithVerb) {
                console.log('   → DESCRIPTION LINE (starts with verb)');
                if (currentProject) {
                    currentProject.description += line + '. '; // Add period and space for proper formatting
                }
                i++;
                continue;
            }

            // STRICT project title detection - must have clear indicators
            const hasExplicitSeparator = line.match(/[|–]/);  // Has separator with technologies
            const hasTechInParens = line.match(/\([^)]*(?:react|node|python|java|javascript|html|css|sql|mongodb|express|angular|vue|django|flask|spring|laravel|typescript|aws|docker|kubernetes|git)[^)]*\)/i);

            // Check if next few lines are bullet points (strong indicator this is a title)
            let nextLinesAreBullets = false;
            let bulletCount = 0;

            // Look ahead at next 3 lines to see if they're bullets/descriptions
            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                const nextLine = lines[j];
                if (!nextLine) continue;

                const isBulletLine = nextLine.match(/^[•\-\*]\s/) || nextLine.match(/^\d+\.\s/);
                const startsWithVerb = actionVerbs.includes(nextLine.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ''));

                if (isBulletLine || startsWithVerb) {
                    bulletCount++;
                }
            }

            nextLinesAreBullets = bulletCount >= 2; // Need at least 2 description lines

            // Additional quality checks for bare titles
            const isQualityTitle = line.length >= 15 && // Must be substantial (not just "Website")
                line.length <= 80 && // Not too long
                line.match(/^[A-Z]/) && // Starts with capital
                !line.endsWith('.') && // Not a sentence
                line.split(/\s+/).length >= 3 && // At least 3 words (more descriptive)
                line.split(/\s+/).length <= 12 && // Not too many words
                !line.match(/^(website|app|application|system|platform)$/i); // Not just generic words

            // STRICT CRITERIA: Must have explicit tech indicators OR (multiple bullet points AND quality title)
            const isValidProject = (hasExplicitSeparator || hasTechInParens) ||
                (nextLinesAreBullets && isQualityTitle);

            if (isValidProject) {
                console.log('   → PROJECT TITLE DETECTED');

                // Save previous project if exists
                if (currentProject) {
                    currentProject.description = currentProject.description.trim();
                    projects.push(currentProject);
                    console.log(`   ✅ Saved project: "${currentProject.name}"`);
                }

                // Parse new project
                let name = line;
                let technologies = [];

                // Extract technologies from separators like "Project Name | React, Node.js"
                const separatorMatch = line.match(/^(.+?)\s*[|–]\s*(.+)$/);
                if (separatorMatch) {
                    name = separatorMatch[1].trim();
                    const techString = separatorMatch[2];
                    technologies = techString.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0 && t.length < 30);
                }

                // Extract technologies from parentheses like "Project Name (React, Node.js)"
                const parenMatch = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
                if (parenMatch) {
                    name = parenMatch[1].trim();
                    const parenTech = parenMatch[2].split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0);
                    technologies = [...technologies, ...parenTech];
                }

                currentProject = {
                    name: name,
                    description: '',
                    technologies: technologies
                };

                console.log(`   📝 New project: "${name}"`);
                if (technologies.length > 0) {
                    console.log(`   🔧 Technologies: [${technologies.join(', ')}]`);
                }
            } else {
                console.log('   → UNRECOGNIZED LINE (treating as description)');
                if (currentProject) {
                    currentProject.description += line + '. '; // Add period and space
                }
            }

            i++;
        }

        // Save the last project
        if (currentProject) {
            currentProject.description = currentProject.description.trim();
            projects.push(currentProject);
            console.log(`   ✅ Saved final project: "${currentProject.name}"`);
        }

        // Clean up project descriptions - remove any stray project titles that got mixed in
        projects.forEach(project => {
            // Remove common project title patterns from descriptions
            project.description = project.description
                .replace(/\b(E-Commerce Website|Website|App|Application|System|Platform)\b\.?\s*/gi, '')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
        });

        console.log(`\n📊 EXTRACTION COMPLETE: Found ${projects.length} projects`);
        projects.forEach((p, idx) => {
            console.log(`   ${idx + 1}. "${p.name}" (${p.technologies.length} technologies)`);
        });

        return projects;
    }

    extractExperience(text) {
        const experience = [];

        // Find WORK EXPERIENCE section
        const expMatch = text.match(/WORK EXPERIENCE\s*\n([\s\S]*?)(?=\n\s*(?:PROJECTS|TECHNICAL SKILLS|SKILLS|EDUCATION|$))/i);

        if (!expMatch) return experience;

        const expSection = expMatch[1];
        const lines = expSection.split('\n');

        let currentExp = null;

        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (!trimmed) continue;

            // Job title line usually has dates (Jan 2025, 2024 - Present, etc.)
            if (trimmed.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i) ||
                trimmed.match(/\d{4}\s*[-–]\s*(Present|\d{4})/i)) {

                if (currentExp) {
                    experience.push(currentExp);
                }

                // Extract role and dates
                const dateMatch = trimmed.match(/(.*?)\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}.*)/i);

                currentExp = {
                    role: dateMatch ? dateMatch[1].trim() : trimmed,
                    company: '',
                    duration: dateMatch ? dateMatch[2].trim() : ''
                };
            }
            // Next line after role is usually company name
            else if (currentExp && !currentExp.company && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                // Company line often has location
                const companyParts = trimmed.split(/[,]/);
                currentExp.company = companyParts[0].trim();
            }
        }

        if (currentExp) {
            experience.push(currentExp);
        }

        return experience;
    }

    extractSkills(text) {
        const skills = [];

        // Find TECHNICAL SKILLS section
        const skillsMatch = text.match(/(?:TECHNICAL SKILLS|SKILLS)\s*\n([\s\S]*?)(?=\n\s*(?:ACHIEVEMENTS|CERTIFICATIONS|PROJECTS|EDUCATION|$))/i);

        if (!skillsMatch) return skills;

        const skillsSection = skillsMatch[1];

        // Extract from lines like "Programming Languages: C++, Python, Java"
        const lines = skillsSection.split('\n');

        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > -1) {
                const skillList = line.substring(colonIndex + 1);
                skillList.split(/[,;]/).forEach(s => {
                    const skill = s.trim();
                    if (skill.length > 0 && skill.length < 40 && !skill.match(/^\d+$/)) {
                        skills.push(skill);
                    }
                });
            }
        }

        return skills;
    }

    async processResume(fileBuffer, mimetype) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const resumeText = await this.extractTextFromFile(fileBuffer, mimetype);

            if (!resumeText || resumeText.length < 50) {
                throw new Error('Resume appears to be empty or too short');
            }

            const extracted = await this.extractAllFromResume(resumeText);

            return {
                content: resumeText,
                skills: extracted.skills,
                projects: extracted.projects,
                experience: extracted.experience,
                education: extracted.education,
                summary: extracted.summary,
                wordCount: resumeText.split(/\s+/).length,
                characterCount: resumeText.length
            };

        } catch (error) {
            console.error('Resume processing error:', error);
            throw error;
        }
    }
}

module.exports = new ResumeProcessor();
