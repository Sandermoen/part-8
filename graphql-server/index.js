const {
  ApolloServer,
  gql,
  UserInputError,
  AuthenticationError,
  PubSub,
} = require('apollo-server');
// const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const pubsub = new PubSub();
require('dotenv').config();

const Author = require('./models/Author');
const Book = require('./models/Book');
const User = require('./models/User');

mongoose
  .connect(process.env.MONGO_URI, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => {
    console.log('Connected to database');
  })
  .catch((err) => console.log('Error connecting to database:', err.message));

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: String
    id: ID!
    bookCount: Int!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]
    allAuthors: [Author!]
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.countDocuments(),
    authorCount: () => Author.countDocuments(),
    allBooks: async (root, args) => {
      if (!args.author && !args.genre) {
        return Book.find({}).populate('author');
      }
      if (args.author) {
        try {
          const author = await Author.findOne({
            name: args.author,
          });
          if (!author) return null;
          if (args.genre) {
            return Book.find({
              author: author._id,
              genres: { $in: [args.genre] },
            }).populate('author');
          }
          return Book.find({ author: author._id }).populate('author');
        } catch (err) {
          throw new UserInputError(err.message);
        }
      }
      if (args.genre) {
        try {
          return Book.find({ genres: { $in: [args.genre] } }).populate(
            'author'
          );
        } catch (err) {
          throw new UserInputError(err.message);
        }
      }
    },
    allAuthors: async () => {
      const authors = await Author.aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: 'author',
            as: 'bookCount',
          },
        },
        {
          $addFields: {
            bookCount: { $size: '$bookCount' },
            id: '$_id',
          },
        },
        { $unset: '_id' },
      ]);
      return authors;
    },
    me: (root, args, context) => context.currentUser,
  },
  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('Not authenticated.');
      }
      try {
        let author = await Author.findOne({ name: args.author });
        if (!author) {
          const newAuthor = new Author({ name: args.author });
          author = await newAuthor.save();
        }
        const book = new Book({ ...args, author: author });
        await book.save();
        pubsub.publish('BOOK_ADDED', { bookAdded: book });
        return book;
      } catch (err) {
        throw new UserInputError(err.message);
      }
    },
    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new AuthenticationError('Not authenticated.');
      }
      try {
        await Author.findOneAndUpdate(
          { name: args.name },
          { born: args.setBornTo }
        );
        const author = await Author.aggregate([
          {
            $match: { name: args.name },
          },
          {
            $lookup: {
              from: 'books',
              localField: '_id',
              foreignField: 'author',
              as: 'bookCount',
            },
          },
          {
            $addFields: { bookCount: { $size: '$bookCount' }, id: '$_id' },
          },
          { $unset: '_id' },
        ]);
        return author[0];
      } catch (err) {
        throw new UserInputError(err.message);
      }
    },
    createUser: (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      try {
        return user.save();
      } catch (err) {
        throw new UserInputError(err.message);
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if (!user || args.password !== 'password') {
        throw new UserInputError('Invalid credentials.');
      }

      const userForToken = {
        username: user.username,
        favoriteGenre: user.favoriteGenre,
        id: user._id,
      };
      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      try {
        const decodedToken = jwt.verify(
          auth.substring(7),
          process.env.JWT_SECRET
        );
        const currentUser = await User.findById(decodedToken.id);
        return { currentUser };
      } catch (err) {
        throw new AuthenticationError('Invalid credentials.');
      }
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
