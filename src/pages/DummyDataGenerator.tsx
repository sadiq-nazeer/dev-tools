import { useState } from 'react';
import { faker } from '@faker-js/faker';
import Editor from '@monaco-editor/react';
import {
    Users,
    Copy,
    Check,
    RefreshCw,
    LayoutList,
    ChevronDown
} from 'lucide-react';

type DataType = 'user' | 'product' | 'company' | 'address';

export default function DummyDataGenerator() {
    const [type, setType] = useState<DataType>('user');
    const [count, setCount] = useState(5);
    const [data, setData] = useState<any[]>([]);
    const [copied, setCopied] = useState(false);

    const generate = () => {
        const results = [];
        for (let i = 0; i < Math.min(count, 100); i++) {
            switch (type) {
                case 'user':
                    results.push({
                        id: faker.string.uuid(),
                        firstName: faker.person.firstName(),
                        lastName: faker.person.lastName(),
                        email: faker.internet.email(),
                        avatar: faker.image.avatar(),
                        jobTitle: faker.person.jobTitle(),
                    });
                    break;
                case 'product':
                    results.push({
                        id: faker.string.uuid(),
                        name: faker.commerce.productName(),
                        price: faker.commerce.price(),
                        description: faker.commerce.productDescription(),
                        category: faker.commerce.department(),
                    });
                    break;
                case 'company':
                    results.push({
                        id: faker.string.uuid(),
                        name: faker.company.name(),
                        catchPhrase: faker.company.catchPhrase(),
                        suffix: faker.company.name().split(' ').pop(),
                    });
                    break;
                case 'address':
                    results.push({
                        street: faker.location.streetAddress(),
                        city: faker.location.city(),
                        state: faker.location.state(),
                        zipCode: faker.location.zipCode(),
                        country: faker.location.country(),
                    });
                    break;
            }
        }
        setData(results);
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-6 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Users className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">Dummy Data Gen</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Mock data for testing</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-secondary/30 rounded-xl px-4 py-2 border">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Count</span>
                        <input
                            type="number"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                            min="1"
                            max="100"
                            className="w-12 bg-transparent focus:outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="relative group">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as DataType)}
                            className="appearance-none bg-secondary/30 border rounded-xl px-6 py-2.5 pr-10 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                        >
                            <option value="user">Users</option>
                            <option value="product">Products</option>
                            <option value="company">Companies</option>
                            <option value="address">Addresses</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                    </div>

                    <button
                        onClick={generate}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
                    >
                        <RefreshCw size={18} /> Generate
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-secondary/5">
                <div className="max-w-5xl mx-auto h-full flex flex-col space-y-4">
                    {data.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Preview {data.length} items</span>
                                <button
                                    onClick={copyToClipboard}
                                    className="flex items-center gap-2 px-4 py-1.5 bg-card border rounded-lg text-xs font-bold hover:bg-secondary transition-all"
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                    {copied ? 'Copied Full JSON' : 'Copy Full JSON'}
                                </button>
                            </div>
                            <div className="flex-1 bg-card border rounded-2xl overflow-hidden shadow-sm">
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    theme="vs-dark"
                                    value={JSON.stringify(data, null, 2)}
                                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, padding: { top: 20 } }}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground">
                            <LayoutList size={64} className="opacity-10 mb-6" />
                            <h3 className="text-xl font-bold mb-2">Ready to generate</h3>
                            <p className="max-w-xs text-center text-sm">Select a data type and count, then click generate to see the mock data here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
