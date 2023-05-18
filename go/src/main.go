// You can edit this code!
// Click here and start typing.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/iden3/go-schema-processor/merklize"
	"github.com/iden3/go-schema-processor/utils"
)

const (
	jsonLDContext = "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld" // JSONLD schema for credential
	typ           = "KYCAgeCredential"                                                                               // credential type
	fieldName     = "birthday"                                                                                       // field name in form of field.field2.field3 field must be present in the credential subject
	schemaJSONLD  = `{
  "@context": [
    {
      "@version": 1.1,
      "@protected": true,
      "id": "@id",
      "type": "@type",
      "KYCAgeCredential": {
        "@id": "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld#KYCAgeCredential",
        "@context": {
          "@version": 1.1,
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "kyc-vocab": "https://github.com/iden3/claim-schema-vocab/blob/main/credentials/kyc.md#",
          "xsd": "http://www.w3.org/2001/XMLSchema#",
          "birthday": {
            "@id": "kyc-vocab:birthday",
            "@type": "xsd:integer"
          },
          "documentType": {
            "@id": "kyc-vocab:documentType",
            "@type": "xsd:integer"
          }
        }
      },
      "KYCCountryOfResidenceCredential": {
        "@id": "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld#KYCCountryOfResidenceCredential",
        "@context": {
          "@version": 1.1,
          "@protected": true,
          "id": "@id",
          "type": "@type",
          "kyc-vocab": "https://github.com/iden3/claim-schema-vocab/blob/main/credentials/kyc.md#",
          "xsd": "http://www.w3.org/2001/XMLSchema#",
          "countryCode": {
            "@id": "kyc-vocab:countryCode",
            "@type": "xsd:integer"
          },
          "documentType": {
            "@id": "kyc-vocab:documentType",
            "@type": "xsd:integer"
          }
        }
      }
    }
  ]
}`
)

func main() {

	// content of json ld schema

	schemaID := fmt.Sprintf("%s#%s", jsonLDContext, typ)
	fmt.Println("schemaID")
	fmt.Println(schemaID)
	querySchema := utils.CreateSchemaHash([]byte(schemaID))
	fmt.Println("schema hash")
	fmt.Println(querySchema.BigInt().String())
	path, err := merklize.NewFieldPathFromContext([]byte(schemaJSONLD), typ, fieldName)
	if err != nil {
		log.Fatal(err)
	}
	err = path.Prepend("https://www.w3.org/2018/credentials#credentialSubject")
	if err != nil {
		log.Fatal(err)
	}
	mkPath, err := path.MtEntry()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("claim path key")
	fmt.Println(mkPath.String())

	data := map[string]interface{}{
		"schemaID":     schemaID,
		"schemaHash":   querySchema.BigInt().String(),
		"claimPathKey": mkPath.String(),
	}
	jsonBytes, err := json.MarshalIndent(data, "", "    ")
	err = os.WriteFile("schema.json", jsonBytes, 0644)
}
