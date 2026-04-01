
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Record
 * 
 */
export type Record = $Result.DefaultSelection<Prisma.$RecordPayload>
/**
 * Model RecordCompanion
 * 
 */
export type RecordCompanion = $Result.DefaultSelection<Prisma.$RecordCompanionPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.record`: Exposes CRUD operations for the **Record** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Records
    * const records = await prisma.record.findMany()
    * ```
    */
  get record(): Prisma.RecordDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.recordCompanion`: Exposes CRUD operations for the **RecordCompanion** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RecordCompanions
    * const recordCompanions = await prisma.recordCompanion.findMany()
    * ```
    */
  get recordCompanion(): Prisma.RecordCompanionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.2
   * Query Engine version: 94a226be1cf2967af2541cca5529f0f7ba866919
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Record: 'Record',
    RecordCompanion: 'RecordCompanion'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "record" | "recordCompanion"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Record: {
        payload: Prisma.$RecordPayload<ExtArgs>
        fields: Prisma.RecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          findFirst: {
            args: Prisma.RecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          findMany: {
            args: Prisma.RecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>[]
          }
          create: {
            args: Prisma.RecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          createMany: {
            args: Prisma.RecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>[]
          }
          delete: {
            args: Prisma.RecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          update: {
            args: Prisma.RecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          deleteMany: {
            args: Prisma.RecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>[]
          }
          upsert: {
            args: Prisma.RecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordPayload>
          }
          aggregate: {
            args: Prisma.RecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecord>
          }
          groupBy: {
            args: Prisma.RecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecordCountArgs<ExtArgs>
            result: $Utils.Optional<RecordCountAggregateOutputType> | number
          }
        }
      }
      RecordCompanion: {
        payload: Prisma.$RecordCompanionPayload<ExtArgs>
        fields: Prisma.RecordCompanionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RecordCompanionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RecordCompanionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          findFirst: {
            args: Prisma.RecordCompanionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RecordCompanionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          findMany: {
            args: Prisma.RecordCompanionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>[]
          }
          create: {
            args: Prisma.RecordCompanionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          createMany: {
            args: Prisma.RecordCompanionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RecordCompanionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>[]
          }
          delete: {
            args: Prisma.RecordCompanionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          update: {
            args: Prisma.RecordCompanionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          deleteMany: {
            args: Prisma.RecordCompanionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RecordCompanionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RecordCompanionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>[]
          }
          upsert: {
            args: Prisma.RecordCompanionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RecordCompanionPayload>
          }
          aggregate: {
            args: Prisma.RecordCompanionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRecordCompanion>
          }
          groupBy: {
            args: Prisma.RecordCompanionGroupByArgs<ExtArgs>
            result: $Utils.Optional<RecordCompanionGroupByOutputType>[]
          }
          count: {
            args: Prisma.RecordCompanionCountArgs<ExtArgs>
            result: $Utils.Optional<RecordCompanionCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    record?: RecordOmit
    recordCompanion?: RecordCompanionOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    records: number
    companions: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    records?: boolean | UserCountOutputTypeCountRecordsArgs
    companions?: boolean | UserCountOutputTypeCountCompanionsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountRecordsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecordWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCompanionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecordCompanionWhereInput
  }


  /**
   * Count Type RecordCountOutputType
   */

  export type RecordCountOutputType = {
    companions: number
  }

  export type RecordCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    companions?: boolean | RecordCountOutputTypeCountCompanionsArgs
  }

  // Custom InputTypes
  /**
   * RecordCountOutputType without action
   */
  export type RecordCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCountOutputType
     */
    select?: RecordCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RecordCountOutputType without action
   */
  export type RecordCountOutputTypeCountCompanionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecordCompanionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    name: string | null
    team: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    name: string | null
    team: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    name: number
    team: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    name?: true
    team?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    name?: true
    team?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    name?: true
    team?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    name: string
    team: string
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    team?: boolean
    records?: boolean | User$recordsArgs<ExtArgs>
    companions?: boolean | User$companionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    team?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    team?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    name?: boolean
    team?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "team", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    records?: boolean | User$recordsArgs<ExtArgs>
    companions?: boolean | User$companionsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      records: Prisma.$RecordPayload<ExtArgs>[]
      companions: Prisma.$RecordCompanionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      team: string
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    records<T extends User$recordsArgs<ExtArgs> = {}>(args?: Subset<T, User$recordsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    companions<T extends User$companionsArgs<ExtArgs> = {}>(args?: Subset<T, User$companionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly team: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.records
   */
  export type User$recordsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    where?: RecordWhereInput
    orderBy?: RecordOrderByWithRelationInput | RecordOrderByWithRelationInput[]
    cursor?: RecordWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecordScalarFieldEnum | RecordScalarFieldEnum[]
  }

  /**
   * User.companions
   */
  export type User$companionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    where?: RecordCompanionWhereInput
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    cursor?: RecordCompanionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecordCompanionScalarFieldEnum | RecordCompanionScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Record
   */

  export type AggregateRecord = {
    _count: RecordCountAggregateOutputType | null
    _min: RecordMinAggregateOutputType | null
    _max: RecordMaxAggregateOutputType | null
  }

  export type RecordMinAggregateOutputType = {
    id: string | null
    userId: string | null
    date: string | null
    mealType: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecordMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    date: string | null
    mealType: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RecordCountAggregateOutputType = {
    id: number
    userId: number
    date: number
    mealType: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RecordMinAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    mealType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecordMaxAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    mealType?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RecordCountAggregateInputType = {
    id?: true
    userId?: true
    date?: true
    mealType?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Record to aggregate.
     */
    where?: RecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Records to fetch.
     */
    orderBy?: RecordOrderByWithRelationInput | RecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Records
    **/
    _count?: true | RecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecordMaxAggregateInputType
  }

  export type GetRecordAggregateType<T extends RecordAggregateArgs> = {
        [P in keyof T & keyof AggregateRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecord[P]>
      : GetScalarType<T[P], AggregateRecord[P]>
  }




  export type RecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecordWhereInput
    orderBy?: RecordOrderByWithAggregationInput | RecordOrderByWithAggregationInput[]
    by: RecordScalarFieldEnum[] | RecordScalarFieldEnum
    having?: RecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecordCountAggregateInputType | true
    _min?: RecordMinAggregateInputType
    _max?: RecordMaxAggregateInputType
  }

  export type RecordGroupByOutputType = {
    id: string
    userId: string
    date: string
    mealType: string
    createdAt: Date
    updatedAt: Date
    _count: RecordCountAggregateOutputType | null
    _min: RecordMinAggregateOutputType | null
    _max: RecordMaxAggregateOutputType | null
  }

  type GetRecordGroupByPayload<T extends RecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecordGroupByOutputType[P]>
            : GetScalarType<T[P], RecordGroupByOutputType[P]>
        }
      >
    >


  export type RecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    mealType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    companions?: boolean | Record$companionsArgs<ExtArgs>
    _count?: boolean | RecordCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["record"]>

  export type RecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    mealType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["record"]>

  export type RecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    date?: boolean
    mealType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["record"]>

  export type RecordSelectScalar = {
    id?: boolean
    userId?: boolean
    date?: boolean
    mealType?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "date" | "mealType" | "createdAt" | "updatedAt", ExtArgs["result"]["record"]>
  export type RecordInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    companions?: boolean | Record$companionsArgs<ExtArgs>
    _count?: boolean | RecordCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RecordIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RecordIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Record"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      companions: Prisma.$RecordCompanionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      date: string
      mealType: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["record"]>
    composites: {}
  }

  type RecordGetPayload<S extends boolean | null | undefined | RecordDefaultArgs> = $Result.GetResult<Prisma.$RecordPayload, S>

  type RecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RecordCountAggregateInputType | true
    }

  export interface RecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Record'], meta: { name: 'Record' } }
    /**
     * Find zero or one Record that matches the filter.
     * @param {RecordFindUniqueArgs} args - Arguments to find a Record
     * @example
     * // Get one Record
     * const record = await prisma.record.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecordFindUniqueArgs>(args: SelectSubset<T, RecordFindUniqueArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Record that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RecordFindUniqueOrThrowArgs} args - Arguments to find a Record
     * @example
     * // Get one Record
     * const record = await prisma.record.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecordFindUniqueOrThrowArgs>(args: SelectSubset<T, RecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Record that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordFindFirstArgs} args - Arguments to find a Record
     * @example
     * // Get one Record
     * const record = await prisma.record.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecordFindFirstArgs>(args?: SelectSubset<T, RecordFindFirstArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Record that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordFindFirstOrThrowArgs} args - Arguments to find a Record
     * @example
     * // Get one Record
     * const record = await prisma.record.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecordFindFirstOrThrowArgs>(args?: SelectSubset<T, RecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Records that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Records
     * const records = await prisma.record.findMany()
     * 
     * // Get first 10 Records
     * const records = await prisma.record.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recordWithIdOnly = await prisma.record.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecordFindManyArgs>(args?: SelectSubset<T, RecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Record.
     * @param {RecordCreateArgs} args - Arguments to create a Record.
     * @example
     * // Create one Record
     * const Record = await prisma.record.create({
     *   data: {
     *     // ... data to create a Record
     *   }
     * })
     * 
     */
    create<T extends RecordCreateArgs>(args: SelectSubset<T, RecordCreateArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Records.
     * @param {RecordCreateManyArgs} args - Arguments to create many Records.
     * @example
     * // Create many Records
     * const record = await prisma.record.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecordCreateManyArgs>(args?: SelectSubset<T, RecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Records and returns the data saved in the database.
     * @param {RecordCreateManyAndReturnArgs} args - Arguments to create many Records.
     * @example
     * // Create many Records
     * const record = await prisma.record.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Records and only return the `id`
     * const recordWithIdOnly = await prisma.record.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecordCreateManyAndReturnArgs>(args?: SelectSubset<T, RecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Record.
     * @param {RecordDeleteArgs} args - Arguments to delete one Record.
     * @example
     * // Delete one Record
     * const Record = await prisma.record.delete({
     *   where: {
     *     // ... filter to delete one Record
     *   }
     * })
     * 
     */
    delete<T extends RecordDeleteArgs>(args: SelectSubset<T, RecordDeleteArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Record.
     * @param {RecordUpdateArgs} args - Arguments to update one Record.
     * @example
     * // Update one Record
     * const record = await prisma.record.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecordUpdateArgs>(args: SelectSubset<T, RecordUpdateArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Records.
     * @param {RecordDeleteManyArgs} args - Arguments to filter Records to delete.
     * @example
     * // Delete a few Records
     * const { count } = await prisma.record.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecordDeleteManyArgs>(args?: SelectSubset<T, RecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Records
     * const record = await prisma.record.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecordUpdateManyArgs>(args: SelectSubset<T, RecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Records and returns the data updated in the database.
     * @param {RecordUpdateManyAndReturnArgs} args - Arguments to update many Records.
     * @example
     * // Update many Records
     * const record = await prisma.record.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Records and only return the `id`
     * const recordWithIdOnly = await prisma.record.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RecordUpdateManyAndReturnArgs>(args: SelectSubset<T, RecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Record.
     * @param {RecordUpsertArgs} args - Arguments to update or create a Record.
     * @example
     * // Update or create a Record
     * const record = await prisma.record.upsert({
     *   create: {
     *     // ... data to create a Record
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Record we want to update
     *   }
     * })
     */
    upsert<T extends RecordUpsertArgs>(args: SelectSubset<T, RecordUpsertArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Records.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCountArgs} args - Arguments to filter Records to count.
     * @example
     * // Count the number of Records
     * const count = await prisma.record.count({
     *   where: {
     *     // ... the filter for the Records we want to count
     *   }
     * })
    **/
    count<T extends RecordCountArgs>(
      args?: Subset<T, RecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Record.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecordAggregateArgs>(args: Subset<T, RecordAggregateArgs>): Prisma.PrismaPromise<GetRecordAggregateType<T>>

    /**
     * Group by Record.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecordGroupByArgs['orderBy'] }
        : { orderBy?: RecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Record model
   */
  readonly fields: RecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Record.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    companions<T extends Record$companionsArgs<ExtArgs> = {}>(args?: Subset<T, Record$companionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Record model
   */
  interface RecordFieldRefs {
    readonly id: FieldRef<"Record", 'String'>
    readonly userId: FieldRef<"Record", 'String'>
    readonly date: FieldRef<"Record", 'String'>
    readonly mealType: FieldRef<"Record", 'String'>
    readonly createdAt: FieldRef<"Record", 'DateTime'>
    readonly updatedAt: FieldRef<"Record", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Record findUnique
   */
  export type RecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter, which Record to fetch.
     */
    where: RecordWhereUniqueInput
  }

  /**
   * Record findUniqueOrThrow
   */
  export type RecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter, which Record to fetch.
     */
    where: RecordWhereUniqueInput
  }

  /**
   * Record findFirst
   */
  export type RecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter, which Record to fetch.
     */
    where?: RecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Records to fetch.
     */
    orderBy?: RecordOrderByWithRelationInput | RecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Records.
     */
    cursor?: RecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Records.
     */
    distinct?: RecordScalarFieldEnum | RecordScalarFieldEnum[]
  }

  /**
   * Record findFirstOrThrow
   */
  export type RecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter, which Record to fetch.
     */
    where?: RecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Records to fetch.
     */
    orderBy?: RecordOrderByWithRelationInput | RecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Records.
     */
    cursor?: RecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Records.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Records.
     */
    distinct?: RecordScalarFieldEnum | RecordScalarFieldEnum[]
  }

  /**
   * Record findMany
   */
  export type RecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter, which Records to fetch.
     */
    where?: RecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Records to fetch.
     */
    orderBy?: RecordOrderByWithRelationInput | RecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Records.
     */
    cursor?: RecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Records from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Records.
     */
    skip?: number
    distinct?: RecordScalarFieldEnum | RecordScalarFieldEnum[]
  }

  /**
   * Record create
   */
  export type RecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * The data needed to create a Record.
     */
    data: XOR<RecordCreateInput, RecordUncheckedCreateInput>
  }

  /**
   * Record createMany
   */
  export type RecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Records.
     */
    data: RecordCreateManyInput | RecordCreateManyInput[]
  }

  /**
   * Record createManyAndReturn
   */
  export type RecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * The data used to create many Records.
     */
    data: RecordCreateManyInput | RecordCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Record update
   */
  export type RecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * The data needed to update a Record.
     */
    data: XOR<RecordUpdateInput, RecordUncheckedUpdateInput>
    /**
     * Choose, which Record to update.
     */
    where: RecordWhereUniqueInput
  }

  /**
   * Record updateMany
   */
  export type RecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Records.
     */
    data: XOR<RecordUpdateManyMutationInput, RecordUncheckedUpdateManyInput>
    /**
     * Filter which Records to update
     */
    where?: RecordWhereInput
    /**
     * Limit how many Records to update.
     */
    limit?: number
  }

  /**
   * Record updateManyAndReturn
   */
  export type RecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * The data used to update Records.
     */
    data: XOR<RecordUpdateManyMutationInput, RecordUncheckedUpdateManyInput>
    /**
     * Filter which Records to update
     */
    where?: RecordWhereInput
    /**
     * Limit how many Records to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Record upsert
   */
  export type RecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * The filter to search for the Record to update in case it exists.
     */
    where: RecordWhereUniqueInput
    /**
     * In case the Record found by the `where` argument doesn't exist, create a new Record with this data.
     */
    create: XOR<RecordCreateInput, RecordUncheckedCreateInput>
    /**
     * In case the Record was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecordUpdateInput, RecordUncheckedUpdateInput>
  }

  /**
   * Record delete
   */
  export type RecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
    /**
     * Filter which Record to delete.
     */
    where: RecordWhereUniqueInput
  }

  /**
   * Record deleteMany
   */
  export type RecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Records to delete
     */
    where?: RecordWhereInput
    /**
     * Limit how many Records to delete.
     */
    limit?: number
  }

  /**
   * Record.companions
   */
  export type Record$companionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    where?: RecordCompanionWhereInput
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    cursor?: RecordCompanionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RecordCompanionScalarFieldEnum | RecordCompanionScalarFieldEnum[]
  }

  /**
   * Record without action
   */
  export type RecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Record
     */
    select?: RecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Record
     */
    omit?: RecordOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordInclude<ExtArgs> | null
  }


  /**
   * Model RecordCompanion
   */

  export type AggregateRecordCompanion = {
    _count: RecordCompanionCountAggregateOutputType | null
    _min: RecordCompanionMinAggregateOutputType | null
    _max: RecordCompanionMaxAggregateOutputType | null
  }

  export type RecordCompanionMinAggregateOutputType = {
    id: string | null
    recordId: string | null
    userId: string | null
  }

  export type RecordCompanionMaxAggregateOutputType = {
    id: string | null
    recordId: string | null
    userId: string | null
  }

  export type RecordCompanionCountAggregateOutputType = {
    id: number
    recordId: number
    userId: number
    _all: number
  }


  export type RecordCompanionMinAggregateInputType = {
    id?: true
    recordId?: true
    userId?: true
  }

  export type RecordCompanionMaxAggregateInputType = {
    id?: true
    recordId?: true
    userId?: true
  }

  export type RecordCompanionCountAggregateInputType = {
    id?: true
    recordId?: true
    userId?: true
    _all?: true
  }

  export type RecordCompanionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecordCompanion to aggregate.
     */
    where?: RecordCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecordCompanions to fetch.
     */
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RecordCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecordCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecordCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RecordCompanions
    **/
    _count?: true | RecordCompanionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RecordCompanionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RecordCompanionMaxAggregateInputType
  }

  export type GetRecordCompanionAggregateType<T extends RecordCompanionAggregateArgs> = {
        [P in keyof T & keyof AggregateRecordCompanion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRecordCompanion[P]>
      : GetScalarType<T[P], AggregateRecordCompanion[P]>
  }




  export type RecordCompanionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RecordCompanionWhereInput
    orderBy?: RecordCompanionOrderByWithAggregationInput | RecordCompanionOrderByWithAggregationInput[]
    by: RecordCompanionScalarFieldEnum[] | RecordCompanionScalarFieldEnum
    having?: RecordCompanionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RecordCompanionCountAggregateInputType | true
    _min?: RecordCompanionMinAggregateInputType
    _max?: RecordCompanionMaxAggregateInputType
  }

  export type RecordCompanionGroupByOutputType = {
    id: string
    recordId: string
    userId: string
    _count: RecordCompanionCountAggregateOutputType | null
    _min: RecordCompanionMinAggregateOutputType | null
    _max: RecordCompanionMaxAggregateOutputType | null
  }

  type GetRecordCompanionGroupByPayload<T extends RecordCompanionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RecordCompanionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RecordCompanionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RecordCompanionGroupByOutputType[P]>
            : GetScalarType<T[P], RecordCompanionGroupByOutputType[P]>
        }
      >
    >


  export type RecordCompanionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    recordId?: boolean
    userId?: boolean
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recordCompanion"]>

  export type RecordCompanionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    recordId?: boolean
    userId?: boolean
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recordCompanion"]>

  export type RecordCompanionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    recordId?: boolean
    userId?: boolean
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["recordCompanion"]>

  export type RecordCompanionSelectScalar = {
    id?: boolean
    recordId?: boolean
    userId?: boolean
  }

  export type RecordCompanionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "recordId" | "userId", ExtArgs["result"]["recordCompanion"]>
  export type RecordCompanionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RecordCompanionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type RecordCompanionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    record?: boolean | RecordDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $RecordCompanionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RecordCompanion"
    objects: {
      record: Prisma.$RecordPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      recordId: string
      userId: string
    }, ExtArgs["result"]["recordCompanion"]>
    composites: {}
  }

  type RecordCompanionGetPayload<S extends boolean | null | undefined | RecordCompanionDefaultArgs> = $Result.GetResult<Prisma.$RecordCompanionPayload, S>

  type RecordCompanionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RecordCompanionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RecordCompanionCountAggregateInputType | true
    }

  export interface RecordCompanionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RecordCompanion'], meta: { name: 'RecordCompanion' } }
    /**
     * Find zero or one RecordCompanion that matches the filter.
     * @param {RecordCompanionFindUniqueArgs} args - Arguments to find a RecordCompanion
     * @example
     * // Get one RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RecordCompanionFindUniqueArgs>(args: SelectSubset<T, RecordCompanionFindUniqueArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RecordCompanion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RecordCompanionFindUniqueOrThrowArgs} args - Arguments to find a RecordCompanion
     * @example
     * // Get one RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RecordCompanionFindUniqueOrThrowArgs>(args: SelectSubset<T, RecordCompanionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecordCompanion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionFindFirstArgs} args - Arguments to find a RecordCompanion
     * @example
     * // Get one RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RecordCompanionFindFirstArgs>(args?: SelectSubset<T, RecordCompanionFindFirstArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RecordCompanion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionFindFirstOrThrowArgs} args - Arguments to find a RecordCompanion
     * @example
     * // Get one RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RecordCompanionFindFirstOrThrowArgs>(args?: SelectSubset<T, RecordCompanionFindFirstOrThrowArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RecordCompanions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RecordCompanions
     * const recordCompanions = await prisma.recordCompanion.findMany()
     * 
     * // Get first 10 RecordCompanions
     * const recordCompanions = await prisma.recordCompanion.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const recordCompanionWithIdOnly = await prisma.recordCompanion.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RecordCompanionFindManyArgs>(args?: SelectSubset<T, RecordCompanionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RecordCompanion.
     * @param {RecordCompanionCreateArgs} args - Arguments to create a RecordCompanion.
     * @example
     * // Create one RecordCompanion
     * const RecordCompanion = await prisma.recordCompanion.create({
     *   data: {
     *     // ... data to create a RecordCompanion
     *   }
     * })
     * 
     */
    create<T extends RecordCompanionCreateArgs>(args: SelectSubset<T, RecordCompanionCreateArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RecordCompanions.
     * @param {RecordCompanionCreateManyArgs} args - Arguments to create many RecordCompanions.
     * @example
     * // Create many RecordCompanions
     * const recordCompanion = await prisma.recordCompanion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RecordCompanionCreateManyArgs>(args?: SelectSubset<T, RecordCompanionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RecordCompanions and returns the data saved in the database.
     * @param {RecordCompanionCreateManyAndReturnArgs} args - Arguments to create many RecordCompanions.
     * @example
     * // Create many RecordCompanions
     * const recordCompanion = await prisma.recordCompanion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RecordCompanions and only return the `id`
     * const recordCompanionWithIdOnly = await prisma.recordCompanion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RecordCompanionCreateManyAndReturnArgs>(args?: SelectSubset<T, RecordCompanionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RecordCompanion.
     * @param {RecordCompanionDeleteArgs} args - Arguments to delete one RecordCompanion.
     * @example
     * // Delete one RecordCompanion
     * const RecordCompanion = await prisma.recordCompanion.delete({
     *   where: {
     *     // ... filter to delete one RecordCompanion
     *   }
     * })
     * 
     */
    delete<T extends RecordCompanionDeleteArgs>(args: SelectSubset<T, RecordCompanionDeleteArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RecordCompanion.
     * @param {RecordCompanionUpdateArgs} args - Arguments to update one RecordCompanion.
     * @example
     * // Update one RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RecordCompanionUpdateArgs>(args: SelectSubset<T, RecordCompanionUpdateArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RecordCompanions.
     * @param {RecordCompanionDeleteManyArgs} args - Arguments to filter RecordCompanions to delete.
     * @example
     * // Delete a few RecordCompanions
     * const { count } = await prisma.recordCompanion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RecordCompanionDeleteManyArgs>(args?: SelectSubset<T, RecordCompanionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecordCompanions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RecordCompanions
     * const recordCompanion = await prisma.recordCompanion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RecordCompanionUpdateManyArgs>(args: SelectSubset<T, RecordCompanionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RecordCompanions and returns the data updated in the database.
     * @param {RecordCompanionUpdateManyAndReturnArgs} args - Arguments to update many RecordCompanions.
     * @example
     * // Update many RecordCompanions
     * const recordCompanion = await prisma.recordCompanion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RecordCompanions and only return the `id`
     * const recordCompanionWithIdOnly = await prisma.recordCompanion.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RecordCompanionUpdateManyAndReturnArgs>(args: SelectSubset<T, RecordCompanionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RecordCompanion.
     * @param {RecordCompanionUpsertArgs} args - Arguments to update or create a RecordCompanion.
     * @example
     * // Update or create a RecordCompanion
     * const recordCompanion = await prisma.recordCompanion.upsert({
     *   create: {
     *     // ... data to create a RecordCompanion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RecordCompanion we want to update
     *   }
     * })
     */
    upsert<T extends RecordCompanionUpsertArgs>(args: SelectSubset<T, RecordCompanionUpsertArgs<ExtArgs>>): Prisma__RecordCompanionClient<$Result.GetResult<Prisma.$RecordCompanionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RecordCompanions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionCountArgs} args - Arguments to filter RecordCompanions to count.
     * @example
     * // Count the number of RecordCompanions
     * const count = await prisma.recordCompanion.count({
     *   where: {
     *     // ... the filter for the RecordCompanions we want to count
     *   }
     * })
    **/
    count<T extends RecordCompanionCountArgs>(
      args?: Subset<T, RecordCompanionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RecordCompanionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RecordCompanion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RecordCompanionAggregateArgs>(args: Subset<T, RecordCompanionAggregateArgs>): Prisma.PrismaPromise<GetRecordCompanionAggregateType<T>>

    /**
     * Group by RecordCompanion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RecordCompanionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RecordCompanionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RecordCompanionGroupByArgs['orderBy'] }
        : { orderBy?: RecordCompanionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RecordCompanionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRecordCompanionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RecordCompanion model
   */
  readonly fields: RecordCompanionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RecordCompanion.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RecordCompanionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    record<T extends RecordDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RecordDefaultArgs<ExtArgs>>): Prisma__RecordClient<$Result.GetResult<Prisma.$RecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RecordCompanion model
   */
  interface RecordCompanionFieldRefs {
    readonly id: FieldRef<"RecordCompanion", 'String'>
    readonly recordId: FieldRef<"RecordCompanion", 'String'>
    readonly userId: FieldRef<"RecordCompanion", 'String'>
  }
    

  // Custom InputTypes
  /**
   * RecordCompanion findUnique
   */
  export type RecordCompanionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter, which RecordCompanion to fetch.
     */
    where: RecordCompanionWhereUniqueInput
  }

  /**
   * RecordCompanion findUniqueOrThrow
   */
  export type RecordCompanionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter, which RecordCompanion to fetch.
     */
    where: RecordCompanionWhereUniqueInput
  }

  /**
   * RecordCompanion findFirst
   */
  export type RecordCompanionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter, which RecordCompanion to fetch.
     */
    where?: RecordCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecordCompanions to fetch.
     */
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecordCompanions.
     */
    cursor?: RecordCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecordCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecordCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecordCompanions.
     */
    distinct?: RecordCompanionScalarFieldEnum | RecordCompanionScalarFieldEnum[]
  }

  /**
   * RecordCompanion findFirstOrThrow
   */
  export type RecordCompanionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter, which RecordCompanion to fetch.
     */
    where?: RecordCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecordCompanions to fetch.
     */
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RecordCompanions.
     */
    cursor?: RecordCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecordCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecordCompanions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RecordCompanions.
     */
    distinct?: RecordCompanionScalarFieldEnum | RecordCompanionScalarFieldEnum[]
  }

  /**
   * RecordCompanion findMany
   */
  export type RecordCompanionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter, which RecordCompanions to fetch.
     */
    where?: RecordCompanionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RecordCompanions to fetch.
     */
    orderBy?: RecordCompanionOrderByWithRelationInput | RecordCompanionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RecordCompanions.
     */
    cursor?: RecordCompanionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RecordCompanions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RecordCompanions.
     */
    skip?: number
    distinct?: RecordCompanionScalarFieldEnum | RecordCompanionScalarFieldEnum[]
  }

  /**
   * RecordCompanion create
   */
  export type RecordCompanionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * The data needed to create a RecordCompanion.
     */
    data: XOR<RecordCompanionCreateInput, RecordCompanionUncheckedCreateInput>
  }

  /**
   * RecordCompanion createMany
   */
  export type RecordCompanionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RecordCompanions.
     */
    data: RecordCompanionCreateManyInput | RecordCompanionCreateManyInput[]
  }

  /**
   * RecordCompanion createManyAndReturn
   */
  export type RecordCompanionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * The data used to create many RecordCompanions.
     */
    data: RecordCompanionCreateManyInput | RecordCompanionCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecordCompanion update
   */
  export type RecordCompanionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * The data needed to update a RecordCompanion.
     */
    data: XOR<RecordCompanionUpdateInput, RecordCompanionUncheckedUpdateInput>
    /**
     * Choose, which RecordCompanion to update.
     */
    where: RecordCompanionWhereUniqueInput
  }

  /**
   * RecordCompanion updateMany
   */
  export type RecordCompanionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RecordCompanions.
     */
    data: XOR<RecordCompanionUpdateManyMutationInput, RecordCompanionUncheckedUpdateManyInput>
    /**
     * Filter which RecordCompanions to update
     */
    where?: RecordCompanionWhereInput
    /**
     * Limit how many RecordCompanions to update.
     */
    limit?: number
  }

  /**
   * RecordCompanion updateManyAndReturn
   */
  export type RecordCompanionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * The data used to update RecordCompanions.
     */
    data: XOR<RecordCompanionUpdateManyMutationInput, RecordCompanionUncheckedUpdateManyInput>
    /**
     * Filter which RecordCompanions to update
     */
    where?: RecordCompanionWhereInput
    /**
     * Limit how many RecordCompanions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * RecordCompanion upsert
   */
  export type RecordCompanionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * The filter to search for the RecordCompanion to update in case it exists.
     */
    where: RecordCompanionWhereUniqueInput
    /**
     * In case the RecordCompanion found by the `where` argument doesn't exist, create a new RecordCompanion with this data.
     */
    create: XOR<RecordCompanionCreateInput, RecordCompanionUncheckedCreateInput>
    /**
     * In case the RecordCompanion was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RecordCompanionUpdateInput, RecordCompanionUncheckedUpdateInput>
  }

  /**
   * RecordCompanion delete
   */
  export type RecordCompanionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
    /**
     * Filter which RecordCompanion to delete.
     */
    where: RecordCompanionWhereUniqueInput
  }

  /**
   * RecordCompanion deleteMany
   */
  export type RecordCompanionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RecordCompanions to delete
     */
    where?: RecordCompanionWhereInput
    /**
     * Limit how many RecordCompanions to delete.
     */
    limit?: number
  }

  /**
   * RecordCompanion without action
   */
  export type RecordCompanionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RecordCompanion
     */
    select?: RecordCompanionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RecordCompanion
     */
    omit?: RecordCompanionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RecordCompanionInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    name: 'name',
    team: 'team'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const RecordScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    date: 'date',
    mealType: 'mealType',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RecordScalarFieldEnum = (typeof RecordScalarFieldEnum)[keyof typeof RecordScalarFieldEnum]


  export const RecordCompanionScalarFieldEnum: {
    id: 'id',
    recordId: 'recordId',
    userId: 'userId'
  };

  export type RecordCompanionScalarFieldEnum = (typeof RecordCompanionScalarFieldEnum)[keyof typeof RecordCompanionScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    team?: StringFilter<"User"> | string
    records?: RecordListRelationFilter
    companions?: RecordCompanionListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    team?: SortOrder
    records?: RecordOrderByRelationAggregateInput
    companions?: RecordCompanionOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    team?: StringFilter<"User"> | string
    records?: RecordListRelationFilter
    companions?: RecordCompanionListRelationFilter
  }, "id" | "name">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    team?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    team?: StringWithAggregatesFilter<"User"> | string
  }

  export type RecordWhereInput = {
    AND?: RecordWhereInput | RecordWhereInput[]
    OR?: RecordWhereInput[]
    NOT?: RecordWhereInput | RecordWhereInput[]
    id?: StringFilter<"Record"> | string
    userId?: StringFilter<"Record"> | string
    date?: StringFilter<"Record"> | string
    mealType?: StringFilter<"Record"> | string
    createdAt?: DateTimeFilter<"Record"> | Date | string
    updatedAt?: DateTimeFilter<"Record"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    companions?: RecordCompanionListRelationFilter
  }

  export type RecordOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    mealType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    companions?: RecordCompanionOrderByRelationAggregateInput
  }

  export type RecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RecordWhereInput | RecordWhereInput[]
    OR?: RecordWhereInput[]
    NOT?: RecordWhereInput | RecordWhereInput[]
    userId?: StringFilter<"Record"> | string
    date?: StringFilter<"Record"> | string
    mealType?: StringFilter<"Record"> | string
    createdAt?: DateTimeFilter<"Record"> | Date | string
    updatedAt?: DateTimeFilter<"Record"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    companions?: RecordCompanionListRelationFilter
  }, "id">

  export type RecordOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    mealType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RecordCountOrderByAggregateInput
    _max?: RecordMaxOrderByAggregateInput
    _min?: RecordMinOrderByAggregateInput
  }

  export type RecordScalarWhereWithAggregatesInput = {
    AND?: RecordScalarWhereWithAggregatesInput | RecordScalarWhereWithAggregatesInput[]
    OR?: RecordScalarWhereWithAggregatesInput[]
    NOT?: RecordScalarWhereWithAggregatesInput | RecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Record"> | string
    userId?: StringWithAggregatesFilter<"Record"> | string
    date?: StringWithAggregatesFilter<"Record"> | string
    mealType?: StringWithAggregatesFilter<"Record"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Record"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Record"> | Date | string
  }

  export type RecordCompanionWhereInput = {
    AND?: RecordCompanionWhereInput | RecordCompanionWhereInput[]
    OR?: RecordCompanionWhereInput[]
    NOT?: RecordCompanionWhereInput | RecordCompanionWhereInput[]
    id?: StringFilter<"RecordCompanion"> | string
    recordId?: StringFilter<"RecordCompanion"> | string
    userId?: StringFilter<"RecordCompanion"> | string
    record?: XOR<RecordScalarRelationFilter, RecordWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type RecordCompanionOrderByWithRelationInput = {
    id?: SortOrder
    recordId?: SortOrder
    userId?: SortOrder
    record?: RecordOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type RecordCompanionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    recordId_userId?: RecordCompanionRecordIdUserIdCompoundUniqueInput
    AND?: RecordCompanionWhereInput | RecordCompanionWhereInput[]
    OR?: RecordCompanionWhereInput[]
    NOT?: RecordCompanionWhereInput | RecordCompanionWhereInput[]
    recordId?: StringFilter<"RecordCompanion"> | string
    userId?: StringFilter<"RecordCompanion"> | string
    record?: XOR<RecordScalarRelationFilter, RecordWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "recordId_userId">

  export type RecordCompanionOrderByWithAggregationInput = {
    id?: SortOrder
    recordId?: SortOrder
    userId?: SortOrder
    _count?: RecordCompanionCountOrderByAggregateInput
    _max?: RecordCompanionMaxOrderByAggregateInput
    _min?: RecordCompanionMinOrderByAggregateInput
  }

  export type RecordCompanionScalarWhereWithAggregatesInput = {
    AND?: RecordCompanionScalarWhereWithAggregatesInput | RecordCompanionScalarWhereWithAggregatesInput[]
    OR?: RecordCompanionScalarWhereWithAggregatesInput[]
    NOT?: RecordCompanionScalarWhereWithAggregatesInput | RecordCompanionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RecordCompanion"> | string
    recordId?: StringWithAggregatesFilter<"RecordCompanion"> | string
    userId?: StringWithAggregatesFilter<"RecordCompanion"> | string
  }

  export type UserCreateInput = {
    id?: string
    name: string
    team: string
    records?: RecordCreateNestedManyWithoutUserInput
    companions?: RecordCompanionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    name: string
    team: string
    records?: RecordUncheckedCreateNestedManyWithoutUserInput
    companions?: RecordCompanionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    records?: RecordUpdateManyWithoutUserNestedInput
    companions?: RecordCompanionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    records?: RecordUncheckedUpdateManyWithoutUserNestedInput
    companions?: RecordCompanionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    name: string
    team: string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCreateInput = {
    id?: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecordsInput
    companions?: RecordCompanionCreateNestedManyWithoutRecordInput
  }

  export type RecordUncheckedCreateInput = {
    id?: string
    userId: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
    companions?: RecordCompanionUncheckedCreateNestedManyWithoutRecordInput
  }

  export type RecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecordsNestedInput
    companions?: RecordCompanionUpdateManyWithoutRecordNestedInput
  }

  export type RecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companions?: RecordCompanionUncheckedUpdateManyWithoutRecordNestedInput
  }

  export type RecordCreateManyInput = {
    id?: string
    userId: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecordCompanionCreateInput = {
    id?: string
    record: RecordCreateNestedOneWithoutCompanionsInput
    user: UserCreateNestedOneWithoutCompanionsInput
  }

  export type RecordCompanionUncheckedCreateInput = {
    id?: string
    recordId: string
    userId: string
  }

  export type RecordCompanionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    record?: RecordUpdateOneRequiredWithoutCompanionsNestedInput
    user?: UserUpdateOneRequiredWithoutCompanionsNestedInput
  }

  export type RecordCompanionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    recordId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCompanionCreateManyInput = {
    id?: string
    recordId: string
    userId: string
  }

  export type RecordCompanionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCompanionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    recordId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type RecordListRelationFilter = {
    every?: RecordWhereInput
    some?: RecordWhereInput
    none?: RecordWhereInput
  }

  export type RecordCompanionListRelationFilter = {
    every?: RecordCompanionWhereInput
    some?: RecordCompanionWhereInput
    none?: RecordCompanionWhereInput
  }

  export type RecordOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type RecordCompanionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    team?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    team?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    team?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type RecordCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    mealType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecordMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    mealType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RecordMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    date?: SortOrder
    mealType?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type RecordScalarRelationFilter = {
    is?: RecordWhereInput
    isNot?: RecordWhereInput
  }

  export type RecordCompanionRecordIdUserIdCompoundUniqueInput = {
    recordId: string
    userId: string
  }

  export type RecordCompanionCountOrderByAggregateInput = {
    id?: SortOrder
    recordId?: SortOrder
    userId?: SortOrder
  }

  export type RecordCompanionMaxOrderByAggregateInput = {
    id?: SortOrder
    recordId?: SortOrder
    userId?: SortOrder
  }

  export type RecordCompanionMinOrderByAggregateInput = {
    id?: SortOrder
    recordId?: SortOrder
    userId?: SortOrder
  }

  export type RecordCreateNestedManyWithoutUserInput = {
    create?: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput> | RecordCreateWithoutUserInput[] | RecordUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCreateOrConnectWithoutUserInput | RecordCreateOrConnectWithoutUserInput[]
    createMany?: RecordCreateManyUserInputEnvelope
    connect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
  }

  export type RecordCompanionCreateNestedManyWithoutUserInput = {
    create?: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput> | RecordCompanionCreateWithoutUserInput[] | RecordCompanionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutUserInput | RecordCompanionCreateOrConnectWithoutUserInput[]
    createMany?: RecordCompanionCreateManyUserInputEnvelope
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
  }

  export type RecordUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput> | RecordCreateWithoutUserInput[] | RecordUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCreateOrConnectWithoutUserInput | RecordCreateOrConnectWithoutUserInput[]
    createMany?: RecordCreateManyUserInputEnvelope
    connect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
  }

  export type RecordCompanionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput> | RecordCompanionCreateWithoutUserInput[] | RecordCompanionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutUserInput | RecordCompanionCreateOrConnectWithoutUserInput[]
    createMany?: RecordCompanionCreateManyUserInputEnvelope
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type RecordUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput> | RecordCreateWithoutUserInput[] | RecordUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCreateOrConnectWithoutUserInput | RecordCreateOrConnectWithoutUserInput[]
    upsert?: RecordUpsertWithWhereUniqueWithoutUserInput | RecordUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecordCreateManyUserInputEnvelope
    set?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    disconnect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    delete?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    connect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    update?: RecordUpdateWithWhereUniqueWithoutUserInput | RecordUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecordUpdateManyWithWhereWithoutUserInput | RecordUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecordScalarWhereInput | RecordScalarWhereInput[]
  }

  export type RecordCompanionUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput> | RecordCompanionCreateWithoutUserInput[] | RecordCompanionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutUserInput | RecordCompanionCreateOrConnectWithoutUserInput[]
    upsert?: RecordCompanionUpsertWithWhereUniqueWithoutUserInput | RecordCompanionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecordCompanionCreateManyUserInputEnvelope
    set?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    disconnect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    delete?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    update?: RecordCompanionUpdateWithWhereUniqueWithoutUserInput | RecordCompanionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecordCompanionUpdateManyWithWhereWithoutUserInput | RecordCompanionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
  }

  export type RecordUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput> | RecordCreateWithoutUserInput[] | RecordUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCreateOrConnectWithoutUserInput | RecordCreateOrConnectWithoutUserInput[]
    upsert?: RecordUpsertWithWhereUniqueWithoutUserInput | RecordUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecordCreateManyUserInputEnvelope
    set?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    disconnect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    delete?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    connect?: RecordWhereUniqueInput | RecordWhereUniqueInput[]
    update?: RecordUpdateWithWhereUniqueWithoutUserInput | RecordUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecordUpdateManyWithWhereWithoutUserInput | RecordUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecordScalarWhereInput | RecordScalarWhereInput[]
  }

  export type RecordCompanionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput> | RecordCompanionCreateWithoutUserInput[] | RecordCompanionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutUserInput | RecordCompanionCreateOrConnectWithoutUserInput[]
    upsert?: RecordCompanionUpsertWithWhereUniqueWithoutUserInput | RecordCompanionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: RecordCompanionCreateManyUserInputEnvelope
    set?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    disconnect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    delete?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    update?: RecordCompanionUpdateWithWhereUniqueWithoutUserInput | RecordCompanionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: RecordCompanionUpdateManyWithWhereWithoutUserInput | RecordCompanionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutRecordsInput = {
    create?: XOR<UserCreateWithoutRecordsInput, UserUncheckedCreateWithoutRecordsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecordsInput
    connect?: UserWhereUniqueInput
  }

  export type RecordCompanionCreateNestedManyWithoutRecordInput = {
    create?: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput> | RecordCompanionCreateWithoutRecordInput[] | RecordCompanionUncheckedCreateWithoutRecordInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutRecordInput | RecordCompanionCreateOrConnectWithoutRecordInput[]
    createMany?: RecordCompanionCreateManyRecordInputEnvelope
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
  }

  export type RecordCompanionUncheckedCreateNestedManyWithoutRecordInput = {
    create?: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput> | RecordCompanionCreateWithoutRecordInput[] | RecordCompanionUncheckedCreateWithoutRecordInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutRecordInput | RecordCompanionCreateOrConnectWithoutRecordInput[]
    createMany?: RecordCompanionCreateManyRecordInputEnvelope
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type UserUpdateOneRequiredWithoutRecordsNestedInput = {
    create?: XOR<UserCreateWithoutRecordsInput, UserUncheckedCreateWithoutRecordsInput>
    connectOrCreate?: UserCreateOrConnectWithoutRecordsInput
    upsert?: UserUpsertWithoutRecordsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutRecordsInput, UserUpdateWithoutRecordsInput>, UserUncheckedUpdateWithoutRecordsInput>
  }

  export type RecordCompanionUpdateManyWithoutRecordNestedInput = {
    create?: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput> | RecordCompanionCreateWithoutRecordInput[] | RecordCompanionUncheckedCreateWithoutRecordInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutRecordInput | RecordCompanionCreateOrConnectWithoutRecordInput[]
    upsert?: RecordCompanionUpsertWithWhereUniqueWithoutRecordInput | RecordCompanionUpsertWithWhereUniqueWithoutRecordInput[]
    createMany?: RecordCompanionCreateManyRecordInputEnvelope
    set?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    disconnect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    delete?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    update?: RecordCompanionUpdateWithWhereUniqueWithoutRecordInput | RecordCompanionUpdateWithWhereUniqueWithoutRecordInput[]
    updateMany?: RecordCompanionUpdateManyWithWhereWithoutRecordInput | RecordCompanionUpdateManyWithWhereWithoutRecordInput[]
    deleteMany?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
  }

  export type RecordCompanionUncheckedUpdateManyWithoutRecordNestedInput = {
    create?: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput> | RecordCompanionCreateWithoutRecordInput[] | RecordCompanionUncheckedCreateWithoutRecordInput[]
    connectOrCreate?: RecordCompanionCreateOrConnectWithoutRecordInput | RecordCompanionCreateOrConnectWithoutRecordInput[]
    upsert?: RecordCompanionUpsertWithWhereUniqueWithoutRecordInput | RecordCompanionUpsertWithWhereUniqueWithoutRecordInput[]
    createMany?: RecordCompanionCreateManyRecordInputEnvelope
    set?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    disconnect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    delete?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    connect?: RecordCompanionWhereUniqueInput | RecordCompanionWhereUniqueInput[]
    update?: RecordCompanionUpdateWithWhereUniqueWithoutRecordInput | RecordCompanionUpdateWithWhereUniqueWithoutRecordInput[]
    updateMany?: RecordCompanionUpdateManyWithWhereWithoutRecordInput | RecordCompanionUpdateManyWithWhereWithoutRecordInput[]
    deleteMany?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
  }

  export type RecordCreateNestedOneWithoutCompanionsInput = {
    create?: XOR<RecordCreateWithoutCompanionsInput, RecordUncheckedCreateWithoutCompanionsInput>
    connectOrCreate?: RecordCreateOrConnectWithoutCompanionsInput
    connect?: RecordWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutCompanionsInput = {
    create?: XOR<UserCreateWithoutCompanionsInput, UserUncheckedCreateWithoutCompanionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCompanionsInput
    connect?: UserWhereUniqueInput
  }

  export type RecordUpdateOneRequiredWithoutCompanionsNestedInput = {
    create?: XOR<RecordCreateWithoutCompanionsInput, RecordUncheckedCreateWithoutCompanionsInput>
    connectOrCreate?: RecordCreateOrConnectWithoutCompanionsInput
    upsert?: RecordUpsertWithoutCompanionsInput
    connect?: RecordWhereUniqueInput
    update?: XOR<XOR<RecordUpdateToOneWithWhereWithoutCompanionsInput, RecordUpdateWithoutCompanionsInput>, RecordUncheckedUpdateWithoutCompanionsInput>
  }

  export type UserUpdateOneRequiredWithoutCompanionsNestedInput = {
    create?: XOR<UserCreateWithoutCompanionsInput, UserUncheckedCreateWithoutCompanionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutCompanionsInput
    upsert?: UserUpsertWithoutCompanionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCompanionsInput, UserUpdateWithoutCompanionsInput>, UserUncheckedUpdateWithoutCompanionsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type RecordCreateWithoutUserInput = {
    id?: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
    companions?: RecordCompanionCreateNestedManyWithoutRecordInput
  }

  export type RecordUncheckedCreateWithoutUserInput = {
    id?: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
    companions?: RecordCompanionUncheckedCreateNestedManyWithoutRecordInput
  }

  export type RecordCreateOrConnectWithoutUserInput = {
    where: RecordWhereUniqueInput
    create: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput>
  }

  export type RecordCreateManyUserInputEnvelope = {
    data: RecordCreateManyUserInput | RecordCreateManyUserInput[]
  }

  export type RecordCompanionCreateWithoutUserInput = {
    id?: string
    record: RecordCreateNestedOneWithoutCompanionsInput
  }

  export type RecordCompanionUncheckedCreateWithoutUserInput = {
    id?: string
    recordId: string
  }

  export type RecordCompanionCreateOrConnectWithoutUserInput = {
    where: RecordCompanionWhereUniqueInput
    create: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput>
  }

  export type RecordCompanionCreateManyUserInputEnvelope = {
    data: RecordCompanionCreateManyUserInput | RecordCompanionCreateManyUserInput[]
  }

  export type RecordUpsertWithWhereUniqueWithoutUserInput = {
    where: RecordWhereUniqueInput
    update: XOR<RecordUpdateWithoutUserInput, RecordUncheckedUpdateWithoutUserInput>
    create: XOR<RecordCreateWithoutUserInput, RecordUncheckedCreateWithoutUserInput>
  }

  export type RecordUpdateWithWhereUniqueWithoutUserInput = {
    where: RecordWhereUniqueInput
    data: XOR<RecordUpdateWithoutUserInput, RecordUncheckedUpdateWithoutUserInput>
  }

  export type RecordUpdateManyWithWhereWithoutUserInput = {
    where: RecordScalarWhereInput
    data: XOR<RecordUpdateManyMutationInput, RecordUncheckedUpdateManyWithoutUserInput>
  }

  export type RecordScalarWhereInput = {
    AND?: RecordScalarWhereInput | RecordScalarWhereInput[]
    OR?: RecordScalarWhereInput[]
    NOT?: RecordScalarWhereInput | RecordScalarWhereInput[]
    id?: StringFilter<"Record"> | string
    userId?: StringFilter<"Record"> | string
    date?: StringFilter<"Record"> | string
    mealType?: StringFilter<"Record"> | string
    createdAt?: DateTimeFilter<"Record"> | Date | string
    updatedAt?: DateTimeFilter<"Record"> | Date | string
  }

  export type RecordCompanionUpsertWithWhereUniqueWithoutUserInput = {
    where: RecordCompanionWhereUniqueInput
    update: XOR<RecordCompanionUpdateWithoutUserInput, RecordCompanionUncheckedUpdateWithoutUserInput>
    create: XOR<RecordCompanionCreateWithoutUserInput, RecordCompanionUncheckedCreateWithoutUserInput>
  }

  export type RecordCompanionUpdateWithWhereUniqueWithoutUserInput = {
    where: RecordCompanionWhereUniqueInput
    data: XOR<RecordCompanionUpdateWithoutUserInput, RecordCompanionUncheckedUpdateWithoutUserInput>
  }

  export type RecordCompanionUpdateManyWithWhereWithoutUserInput = {
    where: RecordCompanionScalarWhereInput
    data: XOR<RecordCompanionUpdateManyMutationInput, RecordCompanionUncheckedUpdateManyWithoutUserInput>
  }

  export type RecordCompanionScalarWhereInput = {
    AND?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
    OR?: RecordCompanionScalarWhereInput[]
    NOT?: RecordCompanionScalarWhereInput | RecordCompanionScalarWhereInput[]
    id?: StringFilter<"RecordCompanion"> | string
    recordId?: StringFilter<"RecordCompanion"> | string
    userId?: StringFilter<"RecordCompanion"> | string
  }

  export type UserCreateWithoutRecordsInput = {
    id?: string
    name: string
    team: string
    companions?: RecordCompanionCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutRecordsInput = {
    id?: string
    name: string
    team: string
    companions?: RecordCompanionUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutRecordsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutRecordsInput, UserUncheckedCreateWithoutRecordsInput>
  }

  export type RecordCompanionCreateWithoutRecordInput = {
    id?: string
    user: UserCreateNestedOneWithoutCompanionsInput
  }

  export type RecordCompanionUncheckedCreateWithoutRecordInput = {
    id?: string
    userId: string
  }

  export type RecordCompanionCreateOrConnectWithoutRecordInput = {
    where: RecordCompanionWhereUniqueInput
    create: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput>
  }

  export type RecordCompanionCreateManyRecordInputEnvelope = {
    data: RecordCompanionCreateManyRecordInput | RecordCompanionCreateManyRecordInput[]
  }

  export type UserUpsertWithoutRecordsInput = {
    update: XOR<UserUpdateWithoutRecordsInput, UserUncheckedUpdateWithoutRecordsInput>
    create: XOR<UserCreateWithoutRecordsInput, UserUncheckedCreateWithoutRecordsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutRecordsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutRecordsInput, UserUncheckedUpdateWithoutRecordsInput>
  }

  export type UserUpdateWithoutRecordsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    companions?: RecordCompanionUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutRecordsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    companions?: RecordCompanionUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RecordCompanionUpsertWithWhereUniqueWithoutRecordInput = {
    where: RecordCompanionWhereUniqueInput
    update: XOR<RecordCompanionUpdateWithoutRecordInput, RecordCompanionUncheckedUpdateWithoutRecordInput>
    create: XOR<RecordCompanionCreateWithoutRecordInput, RecordCompanionUncheckedCreateWithoutRecordInput>
  }

  export type RecordCompanionUpdateWithWhereUniqueWithoutRecordInput = {
    where: RecordCompanionWhereUniqueInput
    data: XOR<RecordCompanionUpdateWithoutRecordInput, RecordCompanionUncheckedUpdateWithoutRecordInput>
  }

  export type RecordCompanionUpdateManyWithWhereWithoutRecordInput = {
    where: RecordCompanionScalarWhereInput
    data: XOR<RecordCompanionUpdateManyMutationInput, RecordCompanionUncheckedUpdateManyWithoutRecordInput>
  }

  export type RecordCreateWithoutCompanionsInput = {
    id?: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutRecordsInput
  }

  export type RecordUncheckedCreateWithoutCompanionsInput = {
    id?: string
    userId: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecordCreateOrConnectWithoutCompanionsInput = {
    where: RecordWhereUniqueInput
    create: XOR<RecordCreateWithoutCompanionsInput, RecordUncheckedCreateWithoutCompanionsInput>
  }

  export type UserCreateWithoutCompanionsInput = {
    id?: string
    name: string
    team: string
    records?: RecordCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutCompanionsInput = {
    id?: string
    name: string
    team: string
    records?: RecordUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutCompanionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCompanionsInput, UserUncheckedCreateWithoutCompanionsInput>
  }

  export type RecordUpsertWithoutCompanionsInput = {
    update: XOR<RecordUpdateWithoutCompanionsInput, RecordUncheckedUpdateWithoutCompanionsInput>
    create: XOR<RecordCreateWithoutCompanionsInput, RecordUncheckedCreateWithoutCompanionsInput>
    where?: RecordWhereInput
  }

  export type RecordUpdateToOneWithWhereWithoutCompanionsInput = {
    where?: RecordWhereInput
    data: XOR<RecordUpdateWithoutCompanionsInput, RecordUncheckedUpdateWithoutCompanionsInput>
  }

  export type RecordUpdateWithoutCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutRecordsNestedInput
  }

  export type RecordUncheckedUpdateWithoutCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpsertWithoutCompanionsInput = {
    update: XOR<UserUpdateWithoutCompanionsInput, UserUncheckedUpdateWithoutCompanionsInput>
    create: XOR<UserCreateWithoutCompanionsInput, UserUncheckedCreateWithoutCompanionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCompanionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCompanionsInput, UserUncheckedUpdateWithoutCompanionsInput>
  }

  export type UserUpdateWithoutCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    records?: RecordUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutCompanionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    team?: StringFieldUpdateOperationsInput | string
    records?: RecordUncheckedUpdateManyWithoutUserNestedInput
  }

  export type RecordCreateManyUserInput = {
    id?: string
    date: string
    mealType: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RecordCompanionCreateManyUserInput = {
    id?: string
    recordId: string
  }

  export type RecordUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companions?: RecordCompanionUpdateManyWithoutRecordNestedInput
  }

  export type RecordUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    companions?: RecordCompanionUncheckedUpdateManyWithoutRecordNestedInput
  }

  export type RecordUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    date?: StringFieldUpdateOperationsInput | string
    mealType?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RecordCompanionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    record?: RecordUpdateOneRequiredWithoutCompanionsNestedInput
  }

  export type RecordCompanionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    recordId?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCompanionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    recordId?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCompanionCreateManyRecordInput = {
    id?: string
    userId: string
  }

  export type RecordCompanionUpdateWithoutRecordInput = {
    id?: StringFieldUpdateOperationsInput | string
    user?: UserUpdateOneRequiredWithoutCompanionsNestedInput
  }

  export type RecordCompanionUncheckedUpdateWithoutRecordInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }

  export type RecordCompanionUncheckedUpdateManyWithoutRecordInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}