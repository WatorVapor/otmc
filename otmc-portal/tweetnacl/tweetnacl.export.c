#include <math.h>
#include "tweetnacl.h"
#include "emscripten.h"
#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */
  int int_sqrt(int x) {
    return sqrt(x);
  }
  int crypto_sha512(unsigned char *outHash,const unsigned char *msg,unsigned long long msgSize) {
    return crypto_hash_sha512_tweet(outHash,msg,msgSize);
  }
#ifdef __cplusplus
}
#endif /* __cplusplus */
