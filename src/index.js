import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 6000;
let users = [];
let messages = [];
let nextUser = 1;
let nextMessage = 1;

app.use(cors());
app.use(express.json());

// ENDPOINT VERIFICACAO 
app.get('/', (req, res) => {
    res.send('Bem vindo à aplicação');
});

// ENDPOINT SIGNUP 
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ Mensagem: "Todos os campos são obrigatórios" });
    }

    if (users.find(user => user.email === email)) {
        return res.status(400).json({ Mensagem: "Email já cadastrado, insira outro." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: nextUser++, name, email, password: hashedPassword };
    users.push(newUser);
    res.status(201).json({ Mensagem: `Seja bem-vinde ${newUser.name}!` });
});

// ENDPOINT LOGIN
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    return res.status(200).json({ userId: user.id });
});

// ENDPOINT LISTAGEM COM PAGINAÇÃO
app.get('/notes/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 3;

    const userMessages = messages.filter(message => message.userId === userId);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    const paginatedMessages = userMessages.slice(startIndex, endIndex);
    res.status(200).json({
        page,
        perPage,
        totalMessages: userMessages.length,
        totalPages: Math.ceil(userMessages.length / perPage),
        messages: paginatedMessages
    });
});

// CRIAR MENSAGENS 
app.post('/message/:email', (req, res) => {
    const { title, description } = req.body;
    const email = req.params.email;

    const user = users.find(u => u.email === email);
    if (!user || !title || !description) {
        return res.status(400).json({ Mensagem: "Dados inválidos" });
    }

    const newMessage = { id: nextMessage++, title, description, userId: user.id };
    messages.push(newMessage);
    res.status(201).json({ Mensagem: "Mensagem criada com sucesso!" });
});

// LER MENSAGENS
app.get('/message/:email', (req, res) => {
    const email = req.params.email;
    const user = users.find(u => u.email === email);
    if (!user || messages.length === 0) {
        return res.status(400).json({ Mensagem: "Erro ao buscar mensagens" });
    }

    const userMessages = messages
        .filter(msg => msg.userId === user.id)
        .map(msg => `ID: ${msg.id} - Título: ${msg.title} - Descrição: ${msg.description}`);
    
    res.status(200).json({ Mensagem: `Mensagens: ${userMessages.join(", ")}` });
});

// ATUALIZAR MENSAGENS
app.put('/message/:id', (req, res) => {
    const id = Number(req.params.id);
    const { title, description } = req.body;
    const message = messages.find(msg => msg.id === id);
    if (!message || !title || !description) {
        return res.status(400).json({ Mensagem: "Dados inválidos" });
    }
    message.title = title;
    message.description = description;
    res.status(200).json({ Mensagem: "Mensagem atualizada com sucesso!" });
});

// DELETAR MENSAGENS
app.delete('/message/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = messages.findIndex(msg => msg.id === id);
    if (index === -1) {
        return res.status(400).json({ Mensagem: "Mensagem não encontrada" });
    }
    messages.splice(index, 1);
    res.status(200).json({ Mensagem: "Mensagem apagada com sucesso" });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
