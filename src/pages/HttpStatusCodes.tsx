import { useState } from 'react';
import {
    Globe,
    Search,
    ExternalLink,
    ChevronRight,
    Activity
} from 'lucide-react';
import { cn } from '../lib/utils';

const statusCodes = [
    { code: '100', name: 'Continue', desc: 'The server has received the request headers and the client should proceed to send the request body.' },
    { code: '101', name: 'Switching Protocols', desc: 'The requester has asked the server to switch protocols.' },
    { code: '200', name: 'OK', desc: 'Standard response for successful HTTP requests.' },
    { code: '201', name: 'Created', desc: 'The request has been fulfilled, resulting in the creation of a new resource.' },
    { code: '202', name: 'Accepted', desc: 'The request has been accepted for processing, but the processing has not been completed.' },
    { code: '204', name: 'No Content', desc: 'The server successfully processed the request and is not returning any content.' },
    { code: '301', name: 'Moved Permanently', desc: 'This and all future requests should be directed to the given URI.' },
    { code: '302', name: 'Found', desc: 'Common way of performing URL redirection.' },
    { code: '304', name: 'Not Modified', desc: 'Indicates that the resource has not been modified since the version specified by the request headers.' },
    { code: '400', name: 'Bad Request', desc: 'The server cannot or will not process the request due to an apparent client error.' },
    { code: '401', name: 'Unauthorized', desc: 'Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet been provided.' },
    { code: '403', name: 'Forbidden', desc: 'The request was valid, but the server is refusing action. The user might not have the necessary permissions.' },
    { code: '404', name: 'Not Found', desc: 'The requested resource could not be found but may be available in the future.' },
    { code: '405', name: 'Method Not Allowed', desc: 'A request method is not supported for the requested resource.' },
    { code: '408', name: 'Request Timeout', desc: 'The server timed out waiting for the request.' },
    { code: '422', name: 'Unprocessable Entity', desc: 'The request was well-formed but was unable to be followed due to semantic errors.' },
    { code: '429', name: 'Too Many Requests', desc: 'The user has sent too many requests in a given amount of time.' },
    { code: '500', name: 'Internal Server Error', desc: 'A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.' },
    { code: '501', name: 'Not Implemented', desc: 'The server either does not recognize the request method, or it lacks the ability to fulfil the request.' },
    { code: '502', name: 'Bad Gateway', desc: 'The server was acting as a gateway or proxy and received an invalid response from the upstream server.' },
    { code: '503', name: 'Service Unavailable', desc: 'The server is currently unavailable (because it is overloaded or down for maintenance).' },
    { code: '504', name: 'Gateway Timeout', desc: 'The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.' },
];

export default function HttpStatusCodes() {
    const [search, setSearch] = useState('');

    const filtered = statusCodes.filter(c =>
        c.code.includes(search) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const getCategoryColor = (code: string) => {
        const first = code[0];
        switch (first) {
            case '1': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case '2': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case '3': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case '4': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case '5': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex items-center justify-between p-6 border-b bg-card">
                <div className="flex items-center gap-4">
                    <Globe className="text-primary" size={28} />
                    <div>
                        <h2 className="text-2xl font-bold">HTTP Status Codes</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Searchable Reference</p>
                    </div>
                </div>
                <div className="relative w-64 md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search code or name..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto space-y-4">
                    {filtered.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((item) => (
                                <div
                                    key={item.code}
                                    className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-all group flex flex-col h-full"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "px-3 py-1 rounded-lg text-lg font-bold border",
                                            getCategoryColor(item.code)
                                        )}>
                                            {item.code}
                                        </div>
                                        <Activity className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors" size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                                        {item.desc}
                                    </p>
                                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                                        <span className="text-[10px] items-center gap-1 font-bold text-muted-foreground uppercase flex tracking-wider">
                                            <ChevronRight size={12} className="text-primary" />
                                            {item.code.startsWith('2') ? 'Success' : item.code.startsWith('4') ? 'Client Error' : item.code.startsWith('5') ? 'Server Error' : 'Other'}
                                        </span>
                                        <a
                                            href={`https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${item.code}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                            title="View on MDN"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-3xl">
                            <Search size={48} className="opacity-10 mb-4" />
                            <p className="text-lg font-medium italic">No status codes matches your search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
