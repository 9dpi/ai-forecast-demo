import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Checking Environment Variables for Railway Deployment\n');
console.log('='.repeat(60));

const requiredVars = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_PORT',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'TELEGRAM_TOKEN',
    'TELEGRAM_CHAT_ID',
    'ALPHA_VANTAGE_KEY',
    'INTERNAL_AUTH_KEY'
];

const optionalVars = [
    'GEMINI_API_KEY',
    'TZ',
    'NODE_ENV',
    'PORT'
];

let missingCount = 0;
let presentCount = 0;

console.log('\n📋 REQUIRED VARIABLES:\n');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        const masked = value.length > 10
            ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
            : '***';
        console.log(`✅ ${varName.padEnd(25)} = ${masked}`);
        presentCount++;
    } else {
        console.log(`❌ ${varName.padEnd(25)} = MISSING`);
        missingCount++;
    }
});

console.log('\n📋 OPTIONAL VARIABLES:\n');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        console.log(`✅ ${varName.padEnd(25)} = ${value}`);
    } else {
        console.log(`⚠️  ${varName.padEnd(25)} = Not set (optional)`);
    }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 SUMMARY:`);
console.log(`   Present: ${presentCount}/${requiredVars.length} required variables`);
console.log(`   Missing: ${missingCount} required variables\n`);

if (missingCount > 0) {
    console.log('❌ DEPLOYMENT WILL FAIL - Missing required variables!');
    console.log('\n💡 Add these to Railway Shared Variables:\n');
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            console.log(`   ${varName}=<your_value_here>`);
        }
    });
} else {
    console.log('✅ ALL REQUIRED VARIABLES PRESENT - Ready for Railway!');
}
