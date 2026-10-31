// Transformar la respuesta de /api/iconos en estructura de catalogo y busqueda.

const ALIAS = {
    ec2: "amazon ec2",
    s3: "amazon s3",
    alb: "elastic load balancing",
    elb: "elastic load balancing",
    rds: "amazon rds",
    vpc: "amazon vpc",
    iam: "aws iam",
    lambda: "aws lambda",
    nat: "nat gateway",
    igw: "internet gateway",
    cf: "amazon cloudfront",
    cdn: "amazon cloudfront",
    sg: "security group",
    asg: "auto scaling",
    eks: "amazon eks",
    ecs: "amazon ecs",
    sqs: "amazon sqs",
    sns: "amazon sns",
    r53: "amazon route 53",
};

export function parsearCatalogo(items) {
    const mapa = new Map();
    for (const item of items) {
        const cat = item.categoria ?? "General";
        if (!mapa.has(cat)) mapa.set(cat, []);
        mapa.get(cat).push(item);
    }
    return Object.fromEntries([...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function buscar(items, termino) {
    if (!termino || !termino.trim()) return items;
    const t = (ALIAS[termino.toLowerCase().trim()] ?? termino.toLowerCase().trim());
    return items.filter(item =>
        item.nombre.toLowerCase().includes(t) ||
        (item.categoria ?? "").toLowerCase().includes(t)
    );
}

export function todos(catalogo) {
    return Object.values(catalogo).flat();
}
