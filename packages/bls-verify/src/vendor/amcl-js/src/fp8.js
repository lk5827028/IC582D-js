/*
 * Copyright (c) 2012-2020 MIRACL UK Ltd.
 *
 * This file is part of MIRACL Core
 * (see https://github.com/miracl/core).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* Finite Field arithmetic  Fp^8 functions */

/* FP8 elements are of the form a+ib, where i is sqrt(sqrt(-1+sqrt(-1)))  */

var FP8 = function (ctx) {
  'use strict';

  /* general purpose constructor */
  var FP8 = function (c, d) {
    if (c instanceof FP8) {
      this.a = new ctx.FP4(c.a);
      this.b = new ctx.FP4(c.b);
    } else {
      this.a = new ctx.FP4(c);
      this.b = new ctx.FP4(d);
    }
  };

  FP8.prototype = {
    /* reduce all components of this mod Modulus */
    reduce: function () {
      this.a.reduce();
      this.b.reduce();
    },

    /* normalise all components of this mod Modulus */
    norm: function () {
      this.a.norm();
      this.b.norm();
    },

    /* test this==0 ? */
    iszilch: function () {
      return this.a.iszilch() && this.b.iszilch();
    },

    islarger: function () {
      if (this.iszilch()) return 0;
      var cmp = this.b.larger();
      if (cmp != 0) return cmp;
      return this.a.larger();
    },

    toBytes: function (bf) {
      var t = [];
      this.b.toBytes(t);
      for (var i = 0; i < 4 * ctx.BIG.MODBYTES; i++) bf[i] = t[i];
      this.a.toBytes(t);
      for (var i = 0; i < 4 * ctx.BIG.MODBYTES; i++) bf[i + 4 * ctx.BIG.MODBYTES] = t[i];
    },

    /* test this==1 ? */
    isunity: function () {
      var one = new ctx.FP4(1);
      return this.a.equals(one) && this.b.iszilch();
    },

    /* conditional copy of g to this depending on d */
    cmove: function (g, d) {
      this.a.cmove(g.a, d);
      this.b.cmove(g.b, d);
    },

    /* test is w real? That is in a+ib test b is zero */
    isreal: function () {
      return this.b.iszilch();
    },

    /* extract real part a */
    real: function () {
      return this.a;
    },

    geta: function () {
      return this.a;
    },

    /* extract imaginary part b */
    getb: function () {
      return this.b;
    },

    /* test this=x? */
    equals: function (x) {
      return this.a.equals(x.a) && this.b.equals(x.b);
    },

    /* copy this=x */
    copy: function (x) {
      this.a.copy(x.a);
      this.b.copy(x.b);
    },

    /* this=0 */
    zero: function () {
      this.a.zero();
      this.b.zero();
    },

    /* this=1 */
    one: function () {
      this.a.one();
      this.b.zero();
    },

    /* set from two FP4s */
    set: function (c, d) {
      this.a.copy(c);
      this.b.copy(d);
    },

    /* set a */
    seta: function (c) {
      this.a.copy(c);
      this.b.zero();
    },

    sign: function () {
      var p1 = this.a.sign();
      var p2 = this.b.sign();
      if (ctx.FP.BIG_ENDIAN_SIGN) {
        var u = this.b.iszilch() ? 1 : 0;
        p2 ^= (p1 ^ p2) & u;
        return p2;
      } else {
        var u = this.a.iszilch() ? 1 : 0;
        p1 ^= (p1 ^ p2) & u;
        return p1;
      }
    },

    /* this=-this */
    neg: function () {
      this.norm();
      var m = new ctx.FP4(this.a),
        t = new ctx.FP4(0);

      m.add(this.b);
      m.neg();
      t.copy(m);
      t.add(this.b);
      this.b.copy(m);
      this.b.add(this.a);
      this.a.copy(t);
      this.norm();
    },

    /* this=conjugate(this) */
    conj: function () {
      this.b.neg();
      this.norm();
    },

    /* this=-conjugate(this) */
    nconj: function () {
      this.a.neg();
      this.norm();
    },

    /* this+=x */
    add: function (x) {
      this.a.add(x.a);
      this.b.add(x.b);
    },

    /* this-=x */
    sub: function (x) {
      var m = new FP8(x);
      m.neg();
      this.add(m);
    },

    rsub: function (x) {
      this.neg();
      this.add(x);
    },

    /* this*=s where s is FP4 */
    pmul: function (s) {
      this.a.mul(s);
      this.b.mul(s);
    },

    /* this*=c where s is int */
    imul: function (c) {
      this.a.imul(c);
      this.b.imul(c);
    },

    /* this*=this */
    sqr: function () {
      var t1 = new ctx.FP4(this.a),
        t2 = new ctx.FP4(this.b),
        t3 = new ctx.FP4(this.a);

      t3.mul(this.b);
      t1.add(this.b);
      t1.norm();
      t2.times_i();

      t2.add(this.a);
      t2.norm();
      this.a.copy(t1);

      this.a.mul(t2);

      t2.copy(t3);
      t2.times_i();
      t2.add(t3);

      t2.neg();

      this.a.add(t2);

      this.b.copy(t3);
      this.b.add(t3);

      this.norm();
    },

    /* this*=y */
    mul: function (y) {
      var t1 = new ctx.FP4(this.a),
        t2 = new ctx.FP4(this.b),
        t3 = new ctx.FP4(0),
        t4 = new ctx.FP4(this.b);

      t1.mul(y.a);
      t2.mul(y.b);
      t3.copy(y.b);
      t3.add(y.a);
      t4.add(this.a);

      t3.norm();
      t4.norm();

      t4.mul(t3);

      t3.copy(t1);
      t3.neg();
      t4.add(t3);

      t3.copy(t2);
      t3.neg();
      this.b.copy(t4);
      this.b.add(t3);

      t2.times_i();
      this.a.copy(t2);
      this.a.add(t1);

      this.norm();
    },

    /* convert to hex string */
    toString: function () {
      return '[' + this.a.toString() + ',' + this.b.toString() + ']';
    },

    /* this=1/this */
    inverse: function (h) {
      this.norm();

      var t1 = new ctx.FP4(this.a),
        t2 = new ctx.FP4(this.b);

      t1.sqr();
      t2.sqr();
      t2.times_i();
      t2.norm(); // ??
      t1.sub(t2);
      t1.inverse(h);
      this.a.mul(t1);
      t1.neg();
      t1.norm();
      this.b.mul(t1);
    },

    /* this*=i where i = sqrt(-1+sqrt(-1)) */
    times_i: function () {
      var s = new ctx.FP4(this.b),
        t = new ctx.FP4(this.a);

      s.times_i();
      this.b.copy(t);

      this.a.copy(s);
      this.norm();
      if (ctx.FP.TOWER == ctx.FP.POSITOWER) {
        this.neg();
        this.norm();
      }
    },

    times_i2: function () {
      this.a.times_i();
      this.b.times_i();
    },

    /* this=this^q using Frobenius, where q is Modulus */
    frob: function (f) {
      var ff = new ctx.FP2(f);
      ff.sqr();
      ff.mul_ip();
      ff.norm();
      this.a.frob(ff);
      this.b.frob(ff);
      this.b.pmul(f);
      this.b.times_i();
    },

    /* this=this^e */
    /*
        pow: function(e) {
            var w = new FP8(this),
                z = new ctx.BIG(e),
                r = new FP8(1),
                bt;
			w.norm();
			z.norm();
            for (;;) {
                bt = z.parity();
                z.fshr(1);

                if (bt === 1) {
                    r.mul(w);
                }

                if (z.iszilch()) {
                    break;
                }

                w.sqr();
            }
            r.reduce();

            return r;
        }, */

    /* XTR xtr_a function */
    /*
        xtr_A: function(w, y, z) {
            var r = new FP8(w),
                t = new FP8(w);

            r.sub(y);
            r.norm();
            r.pmul(this.a);
            t.add(y);
            t.norm();
            t.pmul(this.b);
            t.times_i();

            this.copy(r);
            this.add(t);
            this.add(z);

            this.reduce();
        },
*/
    /* XTR xtr_d function */
    /*
        xtr_D: function() {
            var w = new FP8(this); //w.copy(this);
            this.sqr();
            w.conj();
            w.add(w);
            this.sub(w);
            this.reduce();
        },
*/
    /* r=x^n using XTR method on traces of FP24s */
    /*
        xtr_pow: function(n) {
			var sf = new FP8(this);
			sf.norm();
            var a = new FP8(3),
                b = new FP8(sf),
                c = new FP8(b),
                t = new FP8(0),
                r = new FP8(0),
                par, v, nb, i;

            c.xtr_D();


            par = n.parity();
            v = new ctx.BIG(n);
			v.norm();
            v.fshr(1);

            if (par === 0) {
                v.dec(1);
                v.norm();
            }

            nb = v.nbits();
            for (i = nb - 1; i >= 0; i--) {
                if (v.bit(i) != 1) {
                    t.copy(b);
                    sf.conj();
                    c.conj();
                    b.xtr_A(a, sf, c);
                    sf.conj();
                    c.copy(t);
                    c.xtr_D();
                    a.xtr_D();
                } else {
                    t.copy(a);
                    t.conj();
                    a.copy(b);
                    a.xtr_D();
                    b.xtr_A(c, sf, t);
                    c.xtr_D();
                }
            }

            if (par === 0) {
                r.copy(c);
            } else {
                r.copy(b);
            }
            r.reduce();

            return r;
        },
*/
    /* r=ck^a.cl^n using XTR double exponentiation method on traces of FP24s. See Stam thesis. */
    /*
        xtr_pow2: function(ck, ckml, ckm2l, a, b) {

            var e = new ctx.BIG(a),
                d = new ctx.BIG(b),
                w = new ctx.BIG(0),
                cu = new FP8(ck),
                cv = new FP8(this),
                cumv = new FP8(ckml),
                cum2v = new FP8(ckm2l),
                r = new FP8(0),
                t = new FP8(0),
                f2 = 0,
                i;

            e.norm();
            d.norm();

            while (d.parity() === 0 && e.parity() === 0) {
                d.fshr(1);
                e.fshr(1);
                f2++;
            }

            while (ctx.BIG.comp(d, e) !== 0) {
                if (ctx.BIG.comp(d, e) > 0) {
                    w.copy(e);
                    w.imul(4);
                    w.norm();

                    if (ctx.BIG.comp(d, w) <= 0) {
                        w.copy(d);
                        d.copy(e);
                        e.rsub(w);
                        e.norm();

                        t.copy(cv);
                        t.xtr_A(cu, cumv, cum2v);
                        cum2v.copy(cumv);
                        cum2v.conj();
                        cumv.copy(cv);
                        cv.copy(cu);
                        cu.copy(t);

                    } else if (d.parity() === 0) {
                        d.fshr(1);
                        r.copy(cum2v);
                        r.conj();
                        t.copy(cumv);
                        t.xtr_A(cu, cv, r);
                        cum2v.copy(cumv);
                        cum2v.xtr_D();
                        cumv.copy(t);
                        cu.xtr_D();
                    } else if (e.parity() == 1) {
                        d.sub(e);
                        d.norm();
                        d.fshr(1);
                        t.copy(cv);
                        t.xtr_A(cu, cumv, cum2v);
                        cu.xtr_D();
                        cum2v.copy(cv);
                        cum2v.xtr_D();
                        cum2v.conj();
                        cv.copy(t);
                    } else {
                        w.copy(d);
                        d.copy(e);
                        d.fshr(1);
                        e.copy(w);
                        t.copy(cumv);
                        t.xtr_D();
                        cumv.copy(cum2v);
                        cumv.conj();
                        cum2v.copy(t);
                        cum2v.conj();
                        t.copy(cv);
                        t.xtr_D();
                        cv.copy(cu);
                        cu.copy(t);
                    }
                }
                if (ctx.BIG.comp(d, e) < 0) {
                    w.copy(d);
                    w.imul(4);
                    w.norm();

                    if (ctx.BIG.comp(e, w) <= 0) {
                        e.sub(d);
                        e.norm();
                        t.copy(cv);
                        t.xtr_A(cu, cumv, cum2v);
                        cum2v.copy(cumv);
                        cumv.copy(cu);
                        cu.copy(t);
                    } else if (e.parity() === 0) {
                        w.copy(d);
                        d.copy(e);
                        d.fshr(1);
                        e.copy(w);
                        t.copy(cumv);
                        t.xtr_D();
                        cumv.copy(cum2v);
                        cumv.conj();
                        cum2v.copy(t);
                        cum2v.conj();
                        t.copy(cv);
                        t.xtr_D();
                        cv.copy(cu);
                        cu.copy(t);
                    } else if (d.parity() == 1) {
                        w.copy(e);
                        e.copy(d);
                        w.sub(d);
                        w.norm();
                        d.copy(w);
                        d.fshr(1);
                        t.copy(cv);
                        t.xtr_A(cu, cumv, cum2v);
                        cumv.conj();
                        cum2v.copy(cu);
                        cum2v.xtr_D();
                        cum2v.conj();
                        cu.copy(cv);
                        cu.xtr_D();
                        cv.copy(t);
                    } else {
                        d.fshr(1);
                        r.copy(cum2v);
                        r.conj();
                        t.copy(cumv);
                        t.xtr_A(cu, cv, r);
                        cum2v.copy(cumv);
                        cum2v.xtr_D();
                        cumv.copy(t);
                        cu.xtr_D();
                    }
                }
            }
            r.copy(cv);
            r.xtr_A(cu, cumv, cum2v);
            for (i = 0; i < f2; i++) {
                r.xtr_D();
            }
            r = r.xtr_pow(d);
            return r;
        },
*/
    /* New stuff for ecp4.js */

    div2: function () {
      this.a.div2();
      this.b.div2();
    },

    div_i: function () {
      var u = new ctx.FP4(this.a),
        v = new ctx.FP4(this.b);
      u.div_i();
      this.a.copy(v);
      this.b.copy(u);
      if (ctx.FP.TOWER == ctx.FP.POSITOWER) {
        this.neg();
        this.norm();
      }
    },

    qmul: function (s) {
      this.a.pmul(s);
      this.b.pmul(s);
    },

    tmul: function (s) {
      this.a.qmul(s);
      this.b.qmul(s);
    },

    /* this^e */
    /*
        pow: function(e) {
            var r = new FP8(1),
                w = new FP8(this), 
                z = new ctx.BIG(e),
                bt;

            for (;;) {
                bt = z.parity();
                z.fshr(1);
                if (bt == 1) {
                    r.mul(w);
                }

                if (z.iszilch()) {
                    break;
                }
                w.sqr();
            }

            r.reduce();
            this.copy(r);
        },*/

    qr: function (h) {
      var c = new FP8(this);
      c.conj();
      c.mul(this);
      return c.geta().qr(h);
    },

    sqrt: function (h) {
      if (this.iszilch()) {
        return;
      }
      var wa = new ctx.FP4(this.a),
        wb = new ctx.FP4(this.a),
        ws = new ctx.FP4(this.b),
        wt = new ctx.FP4(this.a);
      var hint = new ctx.FP(0);

      ws.sqr();
      wa.sqr();
      ws.times_i();
      ws.norm();
      wa.sub(ws);

      ws.copy(wa);
      ws.norm();
      ws.sqrt(h);

      wa.copy(wt);
      wa.add(ws);
      wa.norm();
      wa.div2();

      wb.copy(this.b);
      wb.div2();
      var qr = wa.qr(hint);

      // tweak hint - multiply old hint by Norm(1/Beta)^e where Beta is irreducible polynomial
      ws.copy(wa);
      var twk = new ctx.FP(0);
      twk.rcopy(ctx.ROM_FIELD.TWK);
      twk.mul(hint);
      ws.div_i();
      ws.norm();

      wa.cmove(ws, 1 - qr);
      hint.cmove(twk, 1 - qr);

      this.a.copy(wa);
      this.a.sqrt(hint);
      ws.copy(wa);
      ws.inverse(hint);
      ws.mul(this.a);
      this.b.copy(ws);
      this.b.mul(wb);
      wt.copy(this.a);

      this.a.cmove(this.b, 1 - qr);
      this.b.cmove(wt, 1 - qr);

      var sgn = this.sign();
      var nr = new FP8(this);
      nr.neg();
      nr.norm();
      this.cmove(nr, sgn);
    },
  };

  FP8.rand = function (rng) {
    return new FP8(ctx.FP4.rand(rng), ctx.FP4.rand(rng));
  };

  FP8.fromBytes = function (bf) {
    var t = [];
    for (var i = 0; i < 4 * ctx.BIG.MODBYTES; i++) t[i] = bf[i];
    var tb = ctx.FP4.fromBytes(t);
    for (var i = 0; i < 4 * ctx.BIG.MODBYTES; i++) t[i] = bf[i + 4 * ctx.BIG.MODBYTES];
    var ta = ctx.FP4.fromBytes(t);
    return new FP8(ta, tb);
  };

  return FP8;
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    FP8: FP8,
  };
}
