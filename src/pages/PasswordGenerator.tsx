import { useState, useCallback, useEffect } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { ToolLayout } from '../components/layout/ToolLayout';
import { usePersistentState } from '../hooks/usePersistentState';
import { useToolPageMeta } from '../hooks/useToolPageMeta';

const WORDS = [
    'apple','brave','cloud','dance','eagle','flame','grace','honey','ivory','jewel',
    'knife','lemon','magic','noble','ocean','piano','quiet','river','storm','tiger',
    'ultra','vivid','witch','xenon','yacht','zebra','amber','blaze','chess','dream',
    'ember','frost','globe','haste','index','judge','karma','laser','maple','novel',
    'orbit','pearl','queen','radar','solar','tower','unite','vapor','waste','xeric',
    'yield','azure','basin','cedar','delta','eclat','fable','giant','haven','image',
    'joint','kiosk','large','metal','night','olive','plumb','quest','ranch','shade',
    'trout','upper','valid','watch','extra','young','zonal','acorn','beard','civic',
    'depot','early','fence','grind','handy','inlet','jarring','kneel','lyric','moral',
    'novel','ozone','plain','quote','rebel','scope','thick','unify','venom','whole',
    'exact','yonder','abbot','booth','canal','doing','email','fauna','glove','hurry',
    'inter','joust','kingpin','lunar','mango','nexus','optic','prime','quill','relay',
    'scout','tonal','ultra','verge','wrath','yacht','abbey','brook','chess','disco',
    'enact','flint','grasp','heron','icing','julep','kelp','lapis','mirth','nerve',
    'onset','prism','quirk','rhino','snare','talon','uncut','vital','woven','expo',
    'aloft','badge','crisp','derby','exist','fluff','grove','hinge','imbue','jazzy',
    'kinky','lithe','midst','notch','oxide','plank','quest','rivet','skiff','tempo',
    'umbra','vivid','waltz','xenon','yearn','zilch','adorn','bench','clown','diver',
    'evoke','flare','girth','hurdle','infer','jaunt','knack','lotus','mural','niche',
    'ovoid','plume','quota','realm','sleek','tapir','under','viola','whisk','pixel',
    'alpha','bison','cubic','denim','elope','frond','gruff','haste','imply','joker',
    'kitty','lyric','major','natal','outwit','plead','quaff','radon','swamp','tepid',
    'unpin','vigor','winch','xenial','yucca','zappy','adage','blunt','canon','dingo',
    'edify','fudge','guava','hovel','irony','jiffy','krewe','lofty','manor','ninja',
];

function getEntropy(wordCount: number, listSize: number): number {
    return wordCount * Math.log2(listSize);
}

export default function PasswordGenerator() {
    const meta = useToolPageMeta();
    const [mode, setMode] = usePersistentState<'password' | 'passphrase'>('pw_mode', 'password');
    const [length, setLength] = usePersistentState<number>('pw_length', 16);
    const [options, setOptions] = usePersistentState('pw_options', {
        uppercase: true, lowercase: true, numbers: true, symbols: true,
    });
    const [password, setPassword] = useState('');

    // Passphrase settings
    const [wordCount, setWordCount] = usePersistentState<number>('pp_words', 4);
    const [separator, setSeparator] = usePersistentState<string>('pp_sep', '-');
    const [capitalize, setCapitalize] = usePersistentState<boolean>('pp_cap', false);
    const [appendNumber, setAppendNumber] = usePersistentState<boolean>('pp_num', false);

    const generatePassword = useCallback(() => {
        const charset: string[] = [];
        if (options.uppercase) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        if (options.lowercase) charset.push('abcdefghijklmnopqrstuvwxyz');
        if (options.numbers) charset.push('0123456789');
        if (options.symbols) charset.push('!@#$%^&*()_+~`|}{[]:;?><,./-=');
        if (charset.length === 0) { setPassword(''); return; }

        const fullCharset = charset.join('');
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);
        setPassword(Array.from(array, v => fullCharset[v % fullCharset.length]).join(''));
    }, [length, options]);

    const generatePassphrase = useCallback(() => {
        const arr = new Uint32Array(wordCount);
        window.crypto.getRandomValues(arr);
        let words = Array.from(arr, v => WORDS[v % WORDS.length]);
        if (capitalize) words = words.map(w => w[0].toUpperCase() + w.slice(1));
        let phrase = words.join(separator);
        if (appendNumber) {
            const [n] = new Uint32Array(1);
            window.crypto.getRandomValues(new Uint32Array([n]));
            const nb = new Uint32Array(1);
            window.crypto.getRandomValues(nb);
            phrase += separator + (nb[0] % 100);
        }
        setPassword(phrase);
    }, [wordCount, separator, capitalize, appendNumber]);

    useEffect(() => {
        if (mode === 'password') generatePassword();
        else generatePassphrase();
    }, [mode, generatePassword, generatePassphrase]);

    const getStrength = () => {
        if (mode === 'passphrase') {
            const entropy = getEntropy(wordCount + (appendNumber ? 1 : 0), WORDS.length);
            if (entropy > 80) return { label: 'Extremely Strong', color: 'text-green-500' };
            if (entropy > 50) return { label: 'Strong', color: 'text-blue-500' };
            return { label: 'Moderate', color: 'text-yellow-500' };
        }
        const entropy = length * Math.log2(
            (options.uppercase ? 26 : 0) + (options.lowercase ? 26 : 0) +
            (options.numbers ? 10 : 0) + (options.symbols ? 30 : 0)
        );
        if (entropy > 128) return { label: 'Extremely Strong', color: 'text-green-500' };
        if (entropy > 64) return { label: 'Strong', color: 'text-blue-500' };
        if (entropy > 32) return { label: 'Medium', color: 'text-yellow-500' };
        return { label: 'Weak', color: 'text-red-500' };
    };

    const strength = getStrength();
    const entropy = mode === 'passphrase'
        ? getEntropy(wordCount + (appendNumber ? 1 : 0), WORDS.length)
        : length * Math.log2(
            (options.uppercase ? 26 : 0) + (options.lowercase ? 26 : 0) +
            (options.numbers ? 10 : 0) + (options.symbols ? 30 : 0)
        );

    const copy = () => {
        if (!password) return;
        return navigator.clipboard.writeText(password);
    };

    const regenerate = () => mode === 'password' ? generatePassword() : generatePassphrase();

    const SEPARATORS = [
        { label: 'Dash  ( - )', value: '-' },
        { label: 'Dot   ( . )', value: '.' },
        { label: 'Space (   )', value: ' ' },
        { label: 'None', value: '' },
        { label: 'Underscore ( _ )', value: '_' },
    ];

    return (
        <ToolLayout
            title={meta?.label ?? 'Password Gen'}
            description={meta?.desc}
            onCopy={copy}
            actions={
                <button onClick={regenerate}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                    <RefreshCw size={14} /> Regenerate
                </button>
            }
        >
            <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Mode Tabs */}
                <div className="flex gap-2 border-b">
                    {(['password', 'passphrase'] as const).map(m => (
                        <button key={m} onClick={() => setMode(m)}
                            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${mode === m ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                            {m}
                        </button>
                    ))}
                </div>

                {/* Output */}
                <div className="bg-secondary/30 border rounded-xl p-6 space-y-4">
                    <div className="text-2xl font-mono break-all text-center select-all leading-relaxed">
                        {password || 'Select options'}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-widest ${strength.color}`}>{strength.label}</span>
                        <span className="text-xs text-muted-foreground">{entropy.toFixed(0)} bits of entropy</span>
                    </div>
                </div>

                {/* Password Settings */}
                {mode === 'password' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <label className="font-medium">Password Length</label>
                                <span className="text-muted-foreground">{length} characters</span>
                            </div>
                            <input type="range" min="8" max="128" value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {Object.entries(options).map(([key, value]) => (
                                <label key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors">
                                    <input type="checkbox" checked={value}
                                        onChange={() => setOptions({ ...options, [key]: !value })}
                                        className="w-4 h-4 accent-primary" />
                                    <span className="text-sm capitalize">{key}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Passphrase Settings */}
                {mode === 'passphrase' && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <label className="font-medium">Number of Words</label>
                                <span className="text-muted-foreground">{wordCount} words</span>
                            </div>
                            <input type="range" min="3" max="8" value={wordCount}
                                onChange={(e) => setWordCount(+e.target.value)}
                                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Word Separator</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {SEPARATORS.map(s => (
                                    <button key={s.value} onClick={() => setSeparator(s.value)}
                                        className={`p-2 rounded-lg border text-xs font-medium transition-colors ${separator === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/20 border-border hover:bg-secondary/40'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/20 cursor-pointer">
                                <input type="checkbox" checked={capitalize} onChange={() => setCapitalize(!capitalize)} className="w-4 h-4 accent-primary" />
                                <span className="text-sm">Capitalize Words</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/20 cursor-pointer">
                                <input type="checkbox" checked={appendNumber} onChange={() => setAppendNumber(!appendNumber)} className="w-4 h-4 accent-primary" />
                                <span className="text-sm">Append Number</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-4 items-start">
                    <Shield className="text-primary shrink-0" size={20} />
                    <div className="space-y-1">
                        <h4 className="text-sm font-semibold">Security Note</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Uses the browser's native CSPRNG. All generation happens locally — nothing leaves your machine.
                        </p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
